const ChatSession = require('../models/ChatSession');

const MAX_HISTORY_LENGTH = 15;

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const normalizeText = (value = '') => String(value).trim();

const getSession = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return null;

  let session = await ChatSession.findOne({ email: normalizedEmail });

  if (!session) {
    session = await ChatSession.create({
      email: normalizedEmail,
      history: [],
      activeTopic: null,
      activeVehicleIndex: null,
      lastVehicleField: null,
      lastIntent: null,
      lastOptionsContext: null
    });
  }

  return session;
};

const getOrCreateSession = async (email) => {
  return getSession(email);
};

const addToHistory = async (session, role, content) => {
  if (!session) return null;

  const cleanRole = normalizeText(role);
  const cleanContent = normalizeText(content);

  if (!cleanRole || !cleanContent) {
    return session;
  }

  if (!['user', 'assistant'].includes(cleanRole)) {
    return session;
  }

  session.history.push({
    role: cleanRole,
    content: cleanContent
  });

  if (session.history.length > MAX_HISTORY_LENGTH) {
    session.history = session.history.slice(-MAX_HISTORY_LENGTH);
  }

  await session.save();
  return session;
};

const updateSession = async (session, updates = {}) => {
  if (!session) return null;

  const safeUpdates = { ...updates };

  if (Object.prototype.hasOwnProperty.call(safeUpdates, 'email')) {
    delete safeUpdates.email;
  }

  if (Object.prototype.hasOwnProperty.call(safeUpdates, 'activeTopic')) {
    safeUpdates.activeTopic = safeUpdates.activeTopic
      ? normalizeText(safeUpdates.activeTopic)
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(safeUpdates, 'lastVehicleField')) {
    safeUpdates.lastVehicleField = safeUpdates.lastVehicleField
      ? normalizeText(safeUpdates.lastVehicleField)
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(safeUpdates, 'lastIntent')) {
    safeUpdates.lastIntent = safeUpdates.lastIntent
      ? normalizeText(safeUpdates.lastIntent)
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(safeUpdates, 'lastOptionsContext')) {
    safeUpdates.lastOptionsContext = safeUpdates.lastOptionsContext
      ? normalizeText(safeUpdates.lastOptionsContext)
      : null;
  }

  if (Object.prototype.hasOwnProperty.call(safeUpdates, 'activeVehicleIndex')) {
    const idx = safeUpdates.activeVehicleIndex;
    safeUpdates.activeVehicleIndex =
      typeof idx === 'number' && idx >= 0 ? idx : null;
  }

  Object.assign(session, safeUpdates);
  await session.save();

  return session;
};

const clearSession = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return null;

  const session = await ChatSession.findOne({ email: normalizedEmail });

  if (!session) return null;

  session.history = [];
  session.activeTopic = null;
  session.activeVehicleIndex = null;
  session.lastVehicleField = null;
  session.lastIntent = null;
  session.lastOptionsContext = null;

  await session.save();
  return session;
};

module.exports = {
  getSession,
  getOrCreateSession,
  addToHistory,
  updateSession,
  clearSession
};