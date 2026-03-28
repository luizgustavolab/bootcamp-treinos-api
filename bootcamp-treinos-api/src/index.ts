import "dotenv/config";
import Fastify from "fastify";
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import z from "zod";
import { auth } from "./lib/auth";
import fastifyCors from "@fastify/cors";

const app = Fastify({  
    logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.all("/api/auth/*", async (request, reply) => {
    const url = `${request.protocol}://${request.headers.host}${request.url}`;
    
    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
        } else if (value) {
            headers.append(key, value);
        }
    });

    const req = new Request(url, {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body),
    });

    const response = await auth.handler(req);

    reply.status(response.status);
    response.headers.forEach((value, key) => {
        reply.header(key, value);
    });

    return reply.send(await response.json());
});

await app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Bootcamp Treinos API',
            description: 'API para o bootcamp de treinos do FSC',
            version: '1.0.0',
        },
        servers: [{ url: "http://localhost:8080" }],
    },
    transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
});

await app.register(fastifyCors, {
    origin: ["http://localhost:3000"],
    credentials: true,
});


app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
        description: "Hello, World",
        tags: ["System"],
        response: {
            200: z.object({
                message: z.string(), 
            })
        }
    },
    handler: () => {
        return { message: "Hello, World" }
    }
});

try {  
    await app.listen({ 
        port: Number(process.env.PORT) || 8080,
        host: '0.0.0.0' 
    });
} catch (err) { 
    app.log.error(err);  
    process.exit(1);
}