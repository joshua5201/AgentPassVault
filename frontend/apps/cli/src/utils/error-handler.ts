export function handleError(error: any, prefix: string = "Error") {
  console.error(`${prefix}:`);
  if (error.status) {
    console.error(`  Status: ${error.status}`);
  }
  if (error.code) {
    console.error(`  Code: ${error.code}`);
  }
  console.error(`  Message: ${error.message}`);

  if (error.serverStackTrace) {
    console.error("\n--- Server Stack Trace ---");
    console.error(error.serverStackTrace);
    console.error("--------------------------\n");
  } else if (error.stack) {
    console.error("  Local Stack Trace:", error.stack);
  }
  process.exit(1);
}
