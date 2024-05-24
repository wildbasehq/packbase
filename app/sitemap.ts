import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const users: any[] = []

  return [
    {
      url: "https://yipnyap.me",
      lastModified: new Date(),
    },
    ...users.map((user) => ({
      url: `https://yipnyap.me/${user.id}`,
      lastModified: new Date(),
    })),
  ];
}
