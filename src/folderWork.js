import fs from 'fs';
import path from 'path';

/**
 * Функция удаления содержимого папки.
 * @param {string} dirname Путь к папке
 */
function clearFolder(dirname) {
    if (!dirname) return;

    fs.readdir(dirname, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(dirname, file), (err) => {
                if (err) throw err;
            });
        }
    });
}

/**
 * Функция инициации папки для файлов.
 * Если папки нет - необходимо её создать.
 * В противном случае, очищаем содержимое.
 */
export function initFilesFolder() {
    const __dirname = './files';
    if (!fs.existsSync(__dirname)){
        fs.mkdirSync(__dirname);
    } else {
        clearFolder(__dirname);
    }
}

