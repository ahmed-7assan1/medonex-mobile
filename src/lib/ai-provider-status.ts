import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useLiveEnabled } from "./query-mode";
import { isFixtureMode } from "./fixtures";
export type AIProviderStatus = {
  id: string;
  name: string;
  configured: boolean | null;
};
const previews: AIProviderStatus[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    configured: null,
  },
  {
    id: "openai",
    name: "OpenAI",
    configured: null,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    configured: null,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    configured: null,
  },
  {
    id: "groq",
    name: "Groq",
    configured: null,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    configured: null,
  },
  {
    id: "xai",
    name: "xAI",
    configured: null,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    configured: null,
  },
  {
    id: "together",
    name: "Together AI",
    configured: null,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    configured: null,
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    configured: null,
  },
  {
    id: "cerebras",
    name: "Cerebras",
    configured: null,
  },
  {
    id: "github",
    name: "GitHub Models",
    configured: null,
  },
  {
    id: "apinex",
    name: "Apinex",
    configured: null,
  },
];
export function useAIProviderStatus() {
  const query = useQuery({
    queryKey: ["ai-provider-status"],
    enabled: useLiveEnabled(),
    queryFn: () =>
      api.get<{ providers: AIProviderStatus[] }>("/ai-provider-status"),
    retry: 1,
  });
  return {
    ...query,
    data: isFixtureMode() ? { providers: previews } : query.data,
  };
}
