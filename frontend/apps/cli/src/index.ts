import { Command } from 'commander';

const program = new Command();

program
  .name('agentpass')
  .description('CLI for AgentPassVault')
  .version('0.1.0');

program.parse();
