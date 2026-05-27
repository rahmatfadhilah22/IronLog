import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const STORE_KEY = "auth.pin_record";

export interface PinRecord {
  version: number;
  pinHash: string;
  salt: string;
  recoveryQuestion: string;
  recoveryAnswerHash: string;
  createdAt: string;
}

async function getRandomBytesHex(byteCount: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteCount);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin + salt);
}

async function readRecord(): Promise<PinRecord | null> {
  const raw = await SecureStore.getItemAsync(STORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PinRecord;
  } catch {
    return null;
  }
}

async function writeRecord(record: PinRecord): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(record));
}

export const pinAuthService = {
  async hasPin(): Promise<boolean> {
    const record = await readRecord();
    return record !== null;
  },

  async setupPin(
    pin: string,
    recoveryQuestion: string,
    recoveryAnswer: string,
  ): Promise<void> {
    const salt = await getRandomBytesHex(16);
    const [pinHash, recoveryAnswerHash] = await Promise.all([
      hashPin(pin, salt),
      hashPin(recoveryAnswer.toLowerCase().trim(), salt),
    ]);

    const record: PinRecord = {
      version: 1,
      pinHash,
      salt,
      recoveryQuestion,
      recoveryAnswerHash,
      createdAt: new Date().toISOString(),
    };

    await writeRecord(record);
  },

  async verifyPin(pin: string): Promise<boolean> {
    const record = await readRecord();
    if (!record) return false;
    const hash = await hashPin(pin, record.salt);
    return hash === record.pinHash;
  },

  async changePin(currentPin: string, newPin: string): Promise<void> {
    const valid = await this.verifyPin(currentPin);
    if (!valid) throw new Error("PIN incorrect");

    const record = await readRecord();
    if (!record) throw new Error("No PIN record found");

    const newHash = await hashPin(newPin, record.salt);
    await writeRecord({ ...record, pinHash: newHash });
  },

  async changeRecovery(
    currentPin: string,
    question: string,
    answer: string,
  ): Promise<void> {
    const valid = await this.verifyPin(currentPin);
    if (!valid) throw new Error("PIN incorrect");

    const record = await readRecord();
    if (!record) throw new Error("No PIN record found");

    const answerHash = await hashPin(answer.toLowerCase().trim(), record.salt);
    await writeRecord({
      ...record,
      recoveryQuestion: question,
      recoveryAnswerHash: answerHash,
    });
  },

  async getRecoveryQuestion(): Promise<string | null> {
    const record = await readRecord();
    return record?.recoveryQuestion ?? null;
  },

  async resetPinViaRecovery(answer: string, newPin: string): Promise<boolean> {
    const record = await readRecord();
    if (!record) return false;

    const answerHash = await hashPin(answer.toLowerCase().trim(), record.salt);
    if (answerHash !== record.recoveryAnswerHash) return false;

    const newSalt = await getRandomBytesHex(16);
    const [newPinHash, newAnswerHash] = await Promise.all([
      hashPin(newPin, newSalt),
      hashPin(answer.toLowerCase().trim(), newSalt),
    ]);

    await writeRecord({
      ...record,
      salt: newSalt,
      pinHash: newPinHash,
      recoveryAnswerHash: newAnswerHash,
    });

    return true;
  },
};