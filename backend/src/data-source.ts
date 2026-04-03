import 'reflect-metadata';

import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

import { getDataSourceOptions } from './config/database.config';

loadEnv();

export const AppDataSource = new DataSource(getDataSourceOptions());
