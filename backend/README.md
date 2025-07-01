# Skill Matrix Backend

## TypeScript Migration

This project is in the process of migrating from JavaScript to TypeScript. The entities folder has been converted to TypeScript.

### Running the Application

During the migration period, you can use the following npm scripts:

- `npm run dev` - Run the application using TypeScript (ts-node)
- `npm run dev:js` - Run the application using JavaScript (for backward compatibility)
- `npm run build` - Build the TypeScript code to JavaScript
- `npm run start` - Run the built JavaScript code
- `npm run start:ts` - Run the application with automatic detection of TypeScript/JavaScript entry point

### Migration Status

- ✅ Entities folder converted to TypeScript
- ⬜ Controllers to be converted
- ⬜ Services to be converted
- ⬜ Routes to be converted
- ⬜ Middlewares to be converted
- ⬜ Utils to be converted

### TypeScript Configuration

The TypeScript configuration is in `tsconfig.json`. It's set up to:

- Allow both JavaScript and TypeScript files during the migration
- Output compiled files to the `dist` directory
- Use CommonJS modules for compatibility with the existing codebase
- Enable interoperability with existing JavaScript modules

### Development

When creating new files, please use TypeScript (.ts) instead of JavaScript (.js).