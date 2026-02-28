import { Command } from "commander";
import {
  setup,
  generateKey,
  registerAgent,
  init,
} from "./commands/identity.js";
import {
  getSecret,
  searchSecrets,
  requestSecret,
  getRequestStatus,
  listSecrets,
} from "./commands/secrets.js";
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
  adminShowAgent,
  adminCreateAgent,
  adminRotateAgentToken,
  adminDeleteAgent,
  adminListRequests,
  adminFulfillRequest,
  adminRejectRequest,
} from "./commands/admin.js";
import { setVerbose } from "./utils/output.js";

const program = new Command();

program
  .name("agentpassvault")
  .description("CLI for AgentPassVault")
  .version("0.1.0")
  .option("-v, --verbose", "Enable verbose output")
  .hook("preAction", (thisCommand) => {
    setVerbose(thisCommand.opts().verbose);
  });

// Identity Commands
const identity = program
  .command("identity")
  .description("Manage agent identity and keys");

identity
  .command("setup")
  .description("Initial setup for the agent")
  .requiredOption("--api-url <url>", "Base URL of the AgentPassVault API")
  .requiredOption("--tenant-id <id>", "Tenant ID")
  .requiredOption("--agent-id <id>", "Agent ID")
  .requiredOption("--app-token <token>", "Application Token")
  .action(setup);

identity
  .command("generate-key")
  .description("Generate a new RSA-OAEP key pair locally")
  .action(generateKey);

identity
  .command("register")
  .description("Register the agent public key with the server")
  .action(registerAgent);

identity
  .command("init")
  .description("One-shot initialization for the agent (setup, generate-key, register)")
  .requiredOption("--api-url <url>", "Base URL of the AgentPassVault API")
  .requiredOption("--tenant-id <id>", "Tenant ID")
  .requiredOption("--agent-id <id>", "Agent ID")
  .requiredOption("--app-token <token>", "Application Token")
  .action(init);

// Agent Commands
const secret = program.command("secret").description("Manage agent secrets");

secret
  .command("get <id>")
  .description("Retrieve and decrypt a secret")
  .action(getSecret);

secret
  .command("search")
  .description("Search for secrets by name and/or metadata")
  .option("--name <name>", "Search by secret name (case-insensitive, partial match)")
  .option("--metadata-json <json>", "Metadata as a JSON string (exclusive with --from-file)")
  .option("--from-file <path>", "Path to a file containing metadata as JSON (exclusive with --metadata-json)")
  .addHelpText(
    "after",
    "\nRequires at least one of `--name`, `--metadata-json`, or `--from-file`.",
  )
  .action(searchSecrets);

secret
  .command("list")
  .description("List available secrets for this agent")
  .action(listSecrets);

const request = program
  .command("request")
  .description("Manage secret requests");

request
  .command("create <name>")
  .description("Create a new secret request")
  .option("--context <text>", "Context for the request")
  .option("--metadata <json>", "Required metadata for the secret")
  .option("--type <create|lease>", "Request type (default: create)")
  .option("--secret-id <id>", "Existing secret ID (required when --type lease)")
  .action((name, options) => requestSecret(name, options));

request
  .command("get <id>")
  .description("Check the status of a secret request")
  .action(getRequestStatus);

// Backward compatible aliases (deprecated)
program
  .command("get-secret <id>")
  .description("[Deprecated] Use: secret get <id>")
  .action((id) => {
    console.error('Deprecated: use "secret get <id>" instead of "get-secret <id>".');
    return getSecret(id);
  });

program
  .command("search-secrets")
  .description("[Deprecated] Use: secret search")
  .option("--name <name>", "Search by secret name (case-insensitive, partial match)")
  .option("--metadata-json <json>", "Metadata as a JSON string (exclusive with --from-file)")
  .option("--from-file <path>", "Path to a file containing metadata as JSON (exclusive with --metadata-json)")
  .addHelpText(
    "after",
    "\nDeprecated. Use `secret search` instead.",
  )
  .action((options) => {
    console.error('Deprecated: use "secret search" instead of "search-secrets".');
    return searchSecrets(options);
  });

program
  .command("request-secret <name>")
  .description("[Deprecated] Use: request create <name>")
  .option("--context <text>", "Context for the request")
  .option("--metadata <json>", "Required metadata for the secret")
  .option("--type <create|lease>", "Request type (default: create)")
  .option("--secret-id <id>", "Existing secret ID (required when --type lease)")
  .action((name, options) => {
    console.error('Deprecated: use "request create <name>" instead of "request-secret <name>".');
    return requestSecret(name, options);
  });

program
  .command("get-request <id>")
  .description("[Deprecated] Use: request get <id>")
  .action((id) => {
    console.error('Deprecated: use "request get <id>" instead of "get-request <id>".');
    return getRequestStatus(id);
  });

// Admin Commands

const admin = program
  .command("admin")
  .description("Admin operations (Human only)");

admin
  .command("login")
  .description("Login as administrator")
  .option("--api-url <url>", "API URL")
  .option("--username <name>", "Username")
  .option("--password <pass>", "Master Password")
  .action(adminLogin);

admin
  .command("register")
  .description("Register a new tenant and administrator")
  .option("--api-url <url>", "API URL")
  .option("--username <name>", "Username")
  .option("--password <pass>", "Master Password")
  .option("--display-name <name>", "Display Name")
  .action(adminRegister);

admin
  .command("delete-tenant <id>")

  .description("Delete a tenant and all its data (Integration Test only)")

  .action(adminDeleteTenant);

const adminSecret = admin.command("secret").description("Manage secrets");

adminSecret
  .command("list")

  .description("List all secrets")

  .action(adminListSecrets);

adminSecret
  .command("view <id>")
  .description("View and decrypt a secret")
  .option("--password <pass>", "Master Password")
  .action(adminViewSecret);

adminSecret
  .command("create")
  .description("Create a new secret")
  .option("--name <name>", "Secret Name")
  .option("--username <username>", "Username/Email for the secret")
  .option("--secret-password <password>", "Password for the secret")
  .option("--password <pass>", "Master Password")
  .action((options) => {
    // Commander converts --secret-password to secretPassword in the options object
    adminCreateSecret(options);
  });

adminSecret
  .command("update <id>")
  .description("Update a secret")
  .option("--name <new-name>", "New name")
  .option("--value <plain>", "New secret value (plaintext)")
  .option("--metadata <json>", "New metadata as JSON")
  .option("--password <pass>", "Master Password")
  .action(adminUpdateSecret);

adminSecret
  .command("delete <id>")

  .description("Delete a secret")

  .action(adminDeleteSecret);

const adminAgent = admin.command("agent").description("Manage agents");

adminAgent
  .command("list")

  .description("List all agents")

  .action(adminListAgents);

adminAgent
  .command("show <id>")
  .description("Show details of an agent")
  .action(adminShowAgent);

adminAgent
  .command("create <name>")

  .description("Create a new agent")

  .action(adminCreateAgent);

adminAgent
  .command("rotate <id>")

  .description("Rotate an agent's app token")

  .action(adminRotateAgentToken);

adminAgent
  .command("delete <id>")

  .description("Delete an agent")

  .action(adminDeleteAgent);

const adminRequest = admin
  .command("request")
  .description("Manage secret requests");

adminRequest
  .command("list")
  .description("List secret requests (shows only pending by default)")
  .option("--all", "Show all requests (including fulfilled and rejected)")
  .action((options) => adminListRequests(options));

adminRequest
  .command("fulfill <requestId>")
  .description("Fulfill a secret request")
  .option("--secret-id <id>", "Fulfill using an existing secret")
  .option("--value <plain>", "Fulfill by creating a new secret with this value")
  .option("--password <pass>", "Master Password")
  .addHelpText(
    "after",
    "\nIf omitted, `--secret-id` is auto-resolved from lease request target (request.secretId) when available.",
  )
  .action(adminFulfillRequest);

adminRequest
  .command("reject <requestId>")

  .description("Reject a secret request")

  .requiredOption("--reason <text>", "Reason for rejection")

  .action((id, options) => adminRejectRequest(id, options.reason));

program.parse();
