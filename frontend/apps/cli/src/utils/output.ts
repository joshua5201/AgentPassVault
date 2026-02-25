let verbose = false;

export function setVerbose(v: boolean) {
  verbose = v;
}

export function printOutput(data: any) {
  console.log(JSON.stringify(data, null, 2));
}

export function logMessage(message: string) {
  if (verbose) {
    console.error(message);
  }
}
