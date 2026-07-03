export const deploymentConfig = {
  port: Number(process.env.DEPLOYMENT_API_PORT ?? 5050),
  containerName: process.env.AZURE_STORAGE_CONTAINER ?? "mfe-artifacts",
  publicBaseUrl: process.env.DEPLOYMENT_PUBLIC_BASE_URL ?? "http://localhost:5050",
  storageConnectionString:
    process.env.AZURE_STORAGE_CONNECTION_STRING ??
    "UseDevelopmentStorage=true",
  environments: ["dev", "staging", "prod"],
  remotes: [
    {
      id: "frodos-franks",
      packageName: "frodos-franks",
      displayName: "Frodos Franks",
      localDistPath: "apps/frodos-franks/dist"
    },
    {
      id: "boromirs-burgers",
      packageName: "boromirs-burgers",
      displayName: "Boromirs Burgers",
      localDistPath: "apps/boromirs-burgers/dist"
    },
    {
      id: "shire-sides",
      packageName: "franks-sides",
      displayName: "Shire Sides",
      localDistPath: "apps/franks-sides/dist"
    },
    {
      id: "gondor-sauces",
      packageName: "burgers-sauces",
      displayName: "Gondor Sauces",
      localDistPath: "apps/burgers-sauces/dist"
    }
  ]
} as const;

export type EnvironmentName = (typeof deploymentConfig.environments)[number];
export type RemoteId = (typeof deploymentConfig.remotes)[number]["id"];
