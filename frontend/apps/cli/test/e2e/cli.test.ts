import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');
const API_URL = process.env.TEST_API_URL || 'http://localhost:58080';
const TEST_CONFIG_DIR = path.join(os.tmpdir(), `agentpassvault-test-config-${Date.now()}`);

function runCli(args: string[], input?: string) {
  const cmd = `node ${CLI_PATH} ${args.join(' ')}`;
  return execSync(cmd, {
    env: { 
      ...process.env, 
      HOME: TEST_CONFIG_DIR,
    },
    input: input,
    encoding: 'utf-8'
  });
}

describe('AgentPassVault CLI E2E Scenarios', () => {
  const adminUsername = `test-admin-${Date.now()}@example.com`;
  const adminPassword = "password123";
  let tenantId: string;
  let agentId: string;
  let appToken: string;

  beforeAll(() => {
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    
    // 1. Admin Register
    console.log('Registering new tenant...');
    const registerOut = runCli(['admin', 'register', '--api-url', API_URL, '--username', adminUsername, '--password', adminPassword, '--display-name', 'Test Admin']);
    console.log('Register Output:', registerOut);
    const tenantIdMatch = registerOut.match(/Tenant ID: (\S+)/);
    tenantId = tenantIdMatch![1];

    // Note: Registration now automatically logs in and saves config

    // 3. Create Agent
    console.log('Creating agent...');
    const createAgentOut = runCli(['admin', 'agent', 'create', 'test-agent']);
    appToken = createAgentOut.match(/App Token: (\S+)/)![1];
    agentId = createAgentOut.match(/Agent ID: (\S+)/)![1];

    // 4. Agent Setup and Register Key
    console.log('Setting up agent...');
    runCli(['identity', 'setup', '--api-url', API_URL, '--tenant-id', tenantId, '--agent-id', agentId, '--app-token', appToken]);
    runCli(['identity', 'register']);
  });

  afterAll(() => {
    console.log('Cleaning up tenant...');
    try {
      if (tenantId) {
        runCli(['admin', 'delete-tenant', tenantId]);
      }
    } catch (e) {
      console.error('Cleanup failed (maybe already deleted):', e);
    }
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  });

  it('Scenario 1: Full Missing Secret Flow (Create and Lease)', async () => {
    console.log('[Scenario 1] Requesting new secret...');
    const requestOut = runCli(['request-secret', 'S1-Secret', '--context', 'Scenario 1 context']);
    const requestId = requestOut.match(/ID: (\S+)/)![1];

    console.log('[Scenario 1] Fulfilling request with new value...');
    runCli(['admin', 'request', 'fulfill', requestId, '--value', 's1-plain-value', '--password', adminPassword]);

    const statusOut = runCli(['get-request', requestId]);
    const secretId = statusOut.match(/Mapped Secret ID: (\S+)/)![1];

    console.log('[Scenario 1] Verifying agent can retrieve secret...');
    const finalSecretOut = runCli(['get-secret', secretId]);
    expect(finalSecretOut).toContain('Value: s1-plain-value');
    expect(finalSecretOut).toContain('Name: S1-Secret');
  });

  it('Scenario 2: Update secret value should invalidate existing leases', async () => {
    console.log('[Scenario 2] Admin creates a secret and leases it...');
    // Non-interactive creation
    runCli(['admin', 'secret', 'create', '--name', 'S2-Secret', '--username', 'user2', '--secret-password', 'pass2', '--password', adminPassword]);
    
    const listOut = runCli(['admin', 'secret', 'list']);
    console.log('List Secrets Output:', listOut);
    const secretId = listOut.match(/- S2-Secret \(ID: (\S+)\)/)![1];

    // Manually lease it to agent
    console.log('[Scenario 2] Manually leasing to agent...');
    const requestOut = runCli(['request-secret', 'S2-Secret-Req']);
    const requestId = requestOut.match(/ID: (\S+)/)![1];
    runCli(['admin', 'request', 'fulfill', requestId, '--secret-id', secretId, '--password', adminPassword]);

        // Verify retrieval works

        console.log('[Scenario 2] Verifying initial retrieval...');

        const retrievalOut = runCli(['get-secret', secretId]);

        expect(retrievalOut).toContain('"username":"user2"');

        expect(retrievalOut).toContain('"password":"pass2"');

    

            // Admin updates secret value

    

            console.log('[Scenario 2] Admin updates secret value (should invalidate lease)...');

    

            runCli(['admin', 'secret', 'update', secretId, '--value', 's2-updated-value'], `${adminPassword}\n`);

    

        

    

        // Verify retrieval FAILS now because lease was deleted on server when value changed

        console.log('[Scenario 2] Verifying retrieval fails after update...');

        try {

          runCli(['get-secret', secretId]);

          expect.fail('Should have failed to retrieve secret after update because lease was invalidated');

        } catch (error: any) {

          expect(error.message).toContain('No valid lease found');

        }

      });

    

            it('Scenario 3: Map request to another existing secret', async () => {

    

              console.log('[Scenario 3] Admin creates an independent secret...');

    

              runCli(['admin', 'secret', 'create', '--name', 'S3-Existing-Secret', '--username', 'user3', '--secret-password', 'pass3', '--password', adminPassword]);

    

              

    

              const listOut = runCli(['admin', 'secret', 'list']);

    

          

    

            const secretId = listOut.match(/- S3-Existing-Secret \(ID: (\S+)\)/)![1];

    

        

    

            console.log('[Scenario 3] Agent requests a DIFFERENT secret...');

    

            const requestOut = runCli(['request-secret', 'S3-New-Request']);

    

            const requestId = requestOut.match(/ID: (\S+)/)![1];

    

        

    

            console.log('[Scenario 3] Admin fulfills request by mapping to pre-existing secret...');

    

            runCli(['admin', 'request', 'fulfill', requestId, '--secret-id', secretId], `${adminPassword}\n`);

    

        

    

        console.log('[Scenario 3] Verifying agent can retrieve the mapped secret...');

        const finalSecretOut = runCli(['get-secret', secretId]);

        expect(finalSecretOut).toContain('"username":"user3"');

        expect(finalSecretOut).toContain('"password":"pass3"');

      });

    });

    