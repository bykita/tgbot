/**
 * Поиск самого популярного автора в массиве.
 * @param {object[]} authors Массив с информацией об авторах
 * @returns {object} Информация об авторе
 */
export function getPopularAuthor(authors) {
    let curAuthor = {
        books: 0,
        id: -1
    };

    if (authors.length === 0) return curAuthor

    for (let author of authors) {
        if (author.books > curAuthor.books) {
            curAuthor = author
        }
    }

    return curAuthor
}

/**
 * Функция для форматирования описания книги.
 * @param {string} description Описание книги
 * @returns {string}
 */
export function strip(description) {
    return description
        .replace(/<br\/>/gm, '\n')
        .replace(/<[^>]*>?/gm, '');
}