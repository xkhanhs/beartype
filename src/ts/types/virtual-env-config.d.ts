export type EnvConfig = {
  isDevelopment: boolean;
  clientVersion: string;
};

declare module "virtual:env-config" {
  export const envConfig: EnvConfig;
}
