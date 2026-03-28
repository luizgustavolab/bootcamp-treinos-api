import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma"; 
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
});

const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
});

export const auth = betterAuth({
    trustedOrigins: ["http://localhost:3000"],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [openAPI()],
});