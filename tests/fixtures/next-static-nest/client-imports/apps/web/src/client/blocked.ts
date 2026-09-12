'use client';
import { readFileSync } from 'node:fs';
import { HealthService } from '../../../api/src/health.service';
import { headers } from 'next/headers';
import { connection } from 'next/server';
export { readFileSync, HealthService, headers, connection };
