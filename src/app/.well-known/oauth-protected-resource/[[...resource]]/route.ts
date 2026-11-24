import { metadataOptions, resourceMetadata } from "@/composition/mcp";

// Served at /.well-known/oauth-protected-resource and /.well-known/oauth-protected-resource/mcp (clients try both).
export { resourceMetadata as GET, metadataOptions as OPTIONS };
