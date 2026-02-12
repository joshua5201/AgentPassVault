import { Command } from 'commander';
import { setup, generateKey, registerAgent } from './commands/identity.js';
import { getSecret, searchSecrets, requestSecret, getRequestStatus } from './commands/secrets.js';
import { 
  adminLogin, 
  adminRegister,
  adminDeleteTenant,
  adminListSecrets, 
  adminViewSecret, 
  adminCreateSecret,
  adminUpdateSecret,
  adminDeleteSecret,
  adminListAgents,
  adminCreateAgent,
  adminRotateAgentToken,
  adminDeleteAgent,
  adminListRequests,
  adminFulfillRequest,
  adminRejectRequest
} from './commands/admin.js';

const program = new Command();

program
  .name('agentpassvault')
  .description('CLI for AgentPassVault')
  .version('0.1.0');

// Identity Commands
const identity = program.command('identity').description('Manage agent identity and keys');

identity.command('setup')
  .description('Initial setup for the agent')
  .requiredOption('--api-url <url>', 'Base URL of the AgentPassVault API')
  .requiredOption('--tenant-id <id>', 'Tenant ID')
  .requiredOption('--agent-id <id>', 'Agent ID')
  .requiredOption('--app-token <token>', 'Application Token')
  .action(setup);

identity.command('generate-key')
  .description('Generate a new RSA-OAEP key pair locally')
  .action(generateKey);

identity.command('register')
  .description('Register the agent public key with the server')
  .action(registerAgent);

// Secret Commands
program.command('get-secret <id>')
  .description('Retrieve and decrypt a secret')
  .action(getSecret);

program.command('search-secrets <metadata-json>')
  .description('Search for secrets by metadata (JSON string)')
  .action(searchSecrets);

program.command('request-secret <name>')
  .description('Create a new secret request')
  .option('--context <text>', 'Context for the request')
  .option('--metadata <json>', 'Required metadata for the secret')
  .action((name, options) => requestSecret(name, options));

program.command('get-request <id>')

  .description('Check the status of a secret request')

  .action(getRequestStatus);



// Admin Commands

const admin = program.command('admin').description('Admin operations (Human only)');



admin.command('login')
  .description('Login as administrator')
  .option('--api-url <url>', 'API URL')
  .option('--username <name>', 'Username')
  .option('--password <pass>', 'Master Password')
  .action(adminLogin);

admin.command('register')
  .description('Register a new tenant and administrator')
  .option('--api-url <url>', 'API URL')
  .option('--username <name>', 'Username')
  .option('--password <pass>', 'Master Password')
  .option('--display-name <name>', 'Display Name')
  .action(adminRegister);







admin.command('delete-tenant <id>')



  .description('Delete a tenant and all its data (Integration Test only)')



  .action(adminDeleteTenant);







const adminSecret = admin.command('secret').description('Manage secrets');



adminSecret.command('list')

  .description('List all secrets')

  .action(adminListSecrets);



adminSecret.command('view <id>')
  .description('View and decrypt a secret')
  .option('--password <pass>', 'Master Password')
  .action(adminViewSecret);

adminSecret.command('create')
  .description('Create a new secret (Interactive)')
  .option('--password <pass>', 'Master Password')
  .action(adminCreateSecret);

adminSecret.command('update <id>')
  .description('Update a secret')
  .option('--name <new-name>', 'New name')
  .option('--value <plain>', 'New secret value (plaintext)')
  .option('--metadata <json>', 'New metadata as JSON')
  .option('--password <pass>', 'Master Password')
  .action(adminUpdateSecret);







adminSecret.command('delete <id>')







  .description('Delete a secret')



  .action(adminDeleteSecret);







const adminAgent = admin.command('agent').description('Manage agents');







adminAgent.command('list')



  .description('List all agents')



  .action(adminListAgents);







adminAgent.command('create <name>')



  .description('Create a new agent')



  .action(adminCreateAgent);







adminAgent.command('rotate <id>')



  .description('Rotate an agent\'s app token')



  .action(adminRotateAgentToken);







adminAgent.command('delete <id>')



  .description('Delete an agent')



  .action(adminDeleteAgent);







const adminRequest = admin.command('request').description('Manage secret requests');







adminRequest.command('list')



  .description('List all pending and fulfilled requests')



  .action(adminListRequests);







adminRequest.command('fulfill <requestId>')
  .description('Fulfill a secret request')
  .option('--secret-id <id>', 'Fulfill using an existing secret')
  .option('--value <plain>', 'Fulfill by creating a new secret with this value')
  .option('--password <pass>', 'Master Password')
  .action(adminFulfillRequest);







adminRequest.command('reject <requestId>')



  .description('Reject a secret request')



  .requiredOption('--reason <text>', 'Reason for rejection')



  .action((id, options) => adminRejectRequest(id, options.reason));







program.parse();




