// Script para remover export {} e todas as linhas de importação 'require' dos arquivos compilados
let fs = require("fs");
let path = require("path");

let outputDir = path.join(__dirname, "..", "server_scripts");

function removeExportsAndImports(dir) {
  let files = fs.readdirSync(dir);

  files.forEach((file) => {
    let filePath = path.join(dir, file);
    let stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      removeExportsAndImports(filePath);
    } else if (file.endsWith(".js")) {
      let content = fs.readFileSync(filePath, "utf8");

      // 1. REMOVE AS IMPORTAÇÕES: let _variavel = require("./path");
      // Captura linhas que começam com 'let ' seguidas de uma variável e '= require'
      // (Geralmente geradas pelo TypeScript para imports relativos)
      content = content.replace(/^\s*let\s+[^=]+\s*=\s*require\s*\([^)]+\);\s*$/gm, "");

      // 2. REMOVE Object.defineProperty(exports, "__esModule", { value: true });
      content = content.replace(/^\s*Object\.defineProperty\(exports,\s*["']__esModule["'],\s*\{\s*value:\s*true\s*\}\s*\);\s*$/gm, "");

      // 3. REMOVE as declarações 'export' nomeadas (ex: exports.func = func;)
      // Note: Essa remoção é perigosa se você precisar exportar outras coisas.
      // No seu exemplo, o FTB Quests/KubeJS já usa a função nativa globalmente,
      // então a remoção da linha 'exports.applyBossPotions = applyBossPotions;' é desejada.
      // Esta regex remove linhas de exports nomeados gerados.
      content = content.replace(/^\s*exports\.([a-zA-Z0-9_$]+)\s*=\s*\1;\s*$/gm, "");

      // 4. REMOVE export {}; e export { }; (Fim de arquivo)
      content = content.replace(/\nexport\s*\{\s*\}\s*;?\s*$/gm, "");
      content = content.replace(/^export\s*\{\s*\}\s*;?\s*$/gm, "");

      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Cleaned: ${file}`);
    }
  });
}

removeExportsAndImports(outputDir);
console.log("Cleanup complete!");
