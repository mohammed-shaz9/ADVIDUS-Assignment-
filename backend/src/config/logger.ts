import { createLogger, format, transports } from 'winston';
import { env } from './env.js';

export const logger = createLogger({
  level: env.logLevel,
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    env.nodeEnv === 'production'
      ? format.json()
      : format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            const stackStr = stack ? `\n${stack}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}${stackStr}`;
          })
        )
  ),
  transports: [new transports.Console()],
});
