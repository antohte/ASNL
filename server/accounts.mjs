import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const maxAge = 60 * 60 * 24 * 14;
const throttleWindow = 15 * 60 * 1000;
const attempts = new Map();
const dummySalt = randomBytes(16);
let database;

function db() {
  if (database) return database;
  const directory = resolve(process.env.ASNL_DATA_DIR || '.asnl-data');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  database = new DatabaseSync(resolve(directory, 'accounts.sqlite'));
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash BLOB NOT NULL,
      salt BLOB NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      birth_date TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    ) STRICT;
  `);
  return database;
}

const digest = token => createHash('sha256').update(token).digest('hex');
const publicUser = row => ({ firstName: row.first_name, lastName: row.last_name, email: row.email });

function sessionToken(request) {
  return request.headers.cookie?.match(/(?:^|;\s*)asnl_session=([a-f0-9]{64})(?:;|$)/)?.[1];
}

function setCookie(request, response, token, duration) {
  const secure = process.env.ASNL_SECURE_COOKIE === '1' || request.socket.encrypted;
  response.setHeader('Set-Cookie', `asnl_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${duration}${secure ? '; Secure' : ''}`);
}

function clearSession(request, response) {
  const token = sessionToken(request);
  if (token) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token));
  setCookie(request, response, '', 0);
}

function startSession(request, response, userId) {
  const previous = sessionToken(request);
  if (previous) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(previous));
  const token = randomBytes(32).toString('hex');
  db().prepare('DELETE FROM sessions WHERE expires <= ?').run(Date.now());
  db().prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(token), userId, Date.now() + maxAge * 1000);
  setCookie(request, response, token, maxAge);
}

function allowAttempt(key) {
  const now = Date.now();
  if (attempts.size > 1000) {
    for (const [ip, limit] of attempts) if (limit.until <= now) attempts.delete(ip);
    if (attempts.size > 5000 && !attempts.has(key)) return false;
  }
  const limit = attempts.get(key);
  if (!limit || limit.until <= now) {
    attempts.set(key, { count: 1, until: now + throttleWindow });
    return true;
  }
  if (limit.count >= 15) return false;
  limit.count += 1;
  return true;
}

async function readBody(request) {
  let length = 0;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 8192) {
      request.resume();
      throw new Error('Le formulaire est trop volumineux.');
    }
    chunks.push(chunk);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Formulaire invalide.');
  return body;
}

function validate(body, register) {
  const value = key => typeof body[key] === 'string' ? body[key].trim() : '';
  const email = value('email').toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Saisissez une adresse e-mail valide.' };
  if (!password || password.length > 256) return { error: 'Saisissez votre mot de passe.' };
  if (!register) return { email, password };
  if (password.length < 12) return { error: 'Le mot de passe doit contenir au moins 12 caractères.' };
  const first_name = value('firstName'), last_name = value('lastName');
  const phone = value('phone'), address = value('address'), birth_date = value('birthDate');
  if (!first_name || !last_name || first_name.length > 80 || last_name.length > 80) return { error: 'Renseignez votre prénom et votre nom.' };
  const digits = phone.replace(/[^0-9]/g, '');
  if (!/^\+?[\d ().-]+$/.test(phone) || digits.length < 7 || digits.length > 15 || phone.length > 30) return { error: 'Saisissez un numéro de téléphone valide.' };
  if (address.length < 5 || address.length > 300) return { error: 'Renseignez votre adresse postale complète.' };
  const date = new Date(birth_date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date) || Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== birth_date || date > new Date() || birth_date.slice(0, 4) < '1900') {
    return { error: 'Saisissez une date de naissance valide.' };
  }
  return { email, password, first_name, last_name, phone, address, birth_date };
}

export function accountMiddleware(request, response, next) {
  const path = request.url?.split('?')[0];
  if (!path?.startsWith('/api/account/')) return next();

  const send = (status, data) => {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
  };

  async function handle() {
    if (path === '/api/account/session' && request.method === 'GET') {
      const token = sessionToken(request);
      const user = token && db().prepare(`
        SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires > ?
      `).get(digest(token), Date.now());
      return send(200, { user: user ? publicUser(user) : null });
    }

    if (!['/api/account/register', '/api/account/login', '/api/account/logout'].includes(path)) return send(404, { error: 'Page introuvable.' });
    if (request.method !== 'POST') return send(405, { error: 'Méthode non autorisée.' });
    const origin = request.headers.origin;
    if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.host ||
      (request.headers['sec-fetch-site'] && request.headers['sec-fetch-site'] !== 'same-origin')) {
      return send(403, { error: 'Ouvrez le formulaire depuis le site ASNL.' });
    }
    if (path === '/api/account/logout') {
      clearSession(request, response);
      return send(200, { user: null });
    }

    if (!request.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Format du formulaire invalide.' });
    const ip = request.socket.remoteAddress ?? 'local';
    if (!allowAttempt(ip)) return send(429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
    let body;
    try {
      body = await readBody(request);
    } catch {
      return send(400, { error: 'Le formulaire est invalide ou trop volumineux.' });
    }
    const register = path === '/api/account/register';
    const details = validate(body, register);
    if (details.error) return send(400, { error: details.error });
    const existing = db().prepare('SELECT * FROM users WHERE email = ?').get(details.email);
    if (!register) {
      const hash = await deriveKey(details.password, existing?.salt ?? dummySalt, 64);
      if (!existing || !timingSafeEqual(hash, existing.password_hash)) {
        return send(401, { error: 'Adresse e-mail ou mot de passe incorrect.' });
      }
      startSession(request, response, existing.id);
      return send(200, { user: publicUser(existing) });
    }
    if (existing) return send(409, { error: 'Cette adresse e-mail est déjà utilisée.' });
    const salt = randomBytes(16);
    const hash = await deriveKey(details.password, salt, 64);
    const record = db().prepare(`
      INSERT INTO users (email, password_hash, salt, first_name, last_name, phone, address, birth_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO NOTHING
      RETURNING id
    `).get(details.email, hash, salt, details.first_name, details.last_name, details.phone, details.address, details.birth_date);
    if (!record) return send(409, { error: 'Cette adresse e-mail est déjà utilisée.' });
    startSession(request, response, record.id);
    return send(201, { user: publicUser(details) });
  }

  void handle().catch(error => {
    console.error('ASNL account API:', error.code ?? error.name);
    if (!response.headersSent) send(500, { error: 'Le service de compte est indisponible. Réessayez plus tard.' });
    else response.end();
  });
}
