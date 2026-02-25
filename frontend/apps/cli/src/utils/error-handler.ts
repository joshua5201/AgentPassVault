export function handleError(error: any, prefix: string = "Error") {
  const errorOutput = {
    error: true,
    prefix,
    message: error.message,
    status: error.status,
    code: error.code,
    serverStackTrace: error.serverStackTrace,
    localStack: error.stack,
  };
  
  console.error(JSON.stringify(errorOutput, null, 2));
  process.exit(1);
}
