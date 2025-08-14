import Voice from "../models/Voice";

export interface AddVoiceParams {
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  tone: "formal" | "casual" | "neutral";
  personality: string;
  speechInstructions: string;
  default: boolean;
}

const addVoice = async (voice: AddVoiceParams) => {
  const newVoice = new Voice(voice);
  await newVoice.save();

  return newVoice;
};

const getVoices = async () => {
  const voices = await Voice.find({ delTs: null }).sort({ crtTs: -1 });

  return voices;
};

const getVoice = async (id: string) => {
  const voice = await Voice.findOne({ _id: id, delTs: null });

  if (!voice) {
    throw new Error("Voice not found");
  }

  return voice;
};

const getVoiceByName = async (name: string) => {
  const voice = await Voice.findOne({ name, delTs: null });

  if (!voice) {
    throw new Error("Voice not found");
  }

  return voice;
};

export { addVoice, getVoices, getVoice, getVoiceByName };
