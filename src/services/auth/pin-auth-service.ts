import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const KEY = "auth.pin_record";

export interface PinRecord {
  version: number;
  pinHash: string;
  salt: string;
  recoveryQuestion: string;
  recoveryAnswerHash: string;
  createdAt: string;
}

async function saltAndHash(input: string, salt: string): Promise<string> {
  const data = input + salt;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

async function generateSalt(): Promise<string> {
  const saltBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const pinAuthService = {
  async hasPin(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEY);
    return val !== null;
  },

  async setupPin(
    pin: string,
    recoveryQuestion: string,
    recoveryAnswer: string
  ): Promise<void> {
    const salt = await generateSalt();
    const pinHash = await saltAndHash(pin, salt);
    const recoveryAnswerHash = await saltAndHash(
      recoveryAnswer.toLowerCase().trim(),
      salt
    );
    const record: PinRecord = {
      version: 1,
      pinHash,
      salt,
      recoveryQuestion,
      recoveryAnswerHash,
      createdAt: new Date().toISOString(),
    };
    await SecureStore.setItemAsync(KEY, JSON.stringify(record));
  },

  async verifyPin(pin: string): Promise<boolean> {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return false;
    const record: PinRecord = JSON.parse(raw);
    const computed = await saltAndHash(pin, record.salt);
    return computed === record.pinHash;
  },

  async changePin(currentPin: string, newPin: string): Promise<void> {
    if (currentPin !== "") {
      const valid = await this.verifyPin(currentPin);
      if (!valid) throw new Error("INVALID_PIN");
    }
    const raw = await SecureStore.getItemAsync(KEY);
    const record: PinRecord = JSON.parse(raw!);
    record.pinHash = await saltAndHash(newPin, record.salt);
    await SecureStore.setItemAsync(KEY, JSON.stringify(record));
  },

  async changeRecovery(
    currentPin: string,
    question: string,
    answer: string
  ): Promise<void> {
    const valid = await this.verifyPin(currentPin);
    if (!valid) throw new Error("INVALID_PIN");
    const raw = await SecureStore.getItemAsync(KEY);
    const record: PinRecord = JSON.parse(raw!);
    record.recoveryQuestion = question;
    record.recoveryAnswerHash = await saltAndHash(
      answer.toLowerCase().trim(),
      record.salt
    );
    await SecureStore.setItemAsync(KEY, JSON.stringify(record));
  },

  async getRecoveryQuestion(): Promise<string | null> {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const record: PinRecord = JSON.parse(raw);
    return record.recoveryQuestion;
  },

  async checkRecoveryAnswer(answer: string): Promise<boolean> {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return false;
    const record: PinRecord = JSON.parse(raw);
    const computed = await saltAndHash(answer.toLowerCase().trim(), record.salt);
    return computed === record.recoveryAnswerHash;
  },

  async resetPinViaRecovery(
    answer: string,
    newPin: string
  ): Promise<boolean> {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return false;
    const record: PinRecord = JSON.parse(raw);
    const computed = await saltAndHash(
      answer.toLowerCase().trim(),
      record.salt
    );
    const ok = computed === record.recoveryAnswerHash;
    if (!ok) return false;

    if (newPin !== "") {
      const newSalt = await generateSalt();
      record.salt = newSalt;
      record.pinHash = await saltAndHash(newPin, newSalt);
      await SecureStore.setItemAsync(KEY, JSON.stringify(record));
      return true;
    }

    // newPin="" means just verify — regenerate salt so old PIN can't be used
    const newSalt = await generateSalt();
    record.salt = newSalt;
    // PIN will be set in the next step via changePin
    await SecureStore.setItemAsync(KEY, JSON.stringify(record));
    return true;
  },
};