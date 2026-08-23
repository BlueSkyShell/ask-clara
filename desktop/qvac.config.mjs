// QVAC bundle scope: Clara only uses the local LLM (llama.cpp completion).
// Without this, bundleSdk packs ALL ~37 QVAC addon families (multi-GB).
export default {
  plugins: ["@qvac/sdk/llamacpp-completion/plugin"],
};
