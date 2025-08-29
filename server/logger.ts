import fs from 'fs';

const LOG_FILE = 'app-debug.log';

// Clear the log file on start
fs.writeFileSync(LOG_FILE, '');

export function log(message: string, data?: any) {
    let logMessage = `${new Date().toISOString()} - ${message}`;
    if (data) {
        logMessage += `\n${JSON.stringify(data, null, 2)}`;
    }
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}
