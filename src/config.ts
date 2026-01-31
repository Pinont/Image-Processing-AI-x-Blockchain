import * as fs from 'fs';
import * as yaml from 'yaml';

interface UsageCost {
    prompt: number;
    generation: number;
}

const configFile = fs.readFileSync('config.yml', 'utf8');
const config = yaml.parse(configFile);

export const usage_cost: UsageCost = config.usage_cost;

export default { usage_cost };