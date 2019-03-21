-- phpMyAdmin SQL Dump
-- version 3.5.1
-- http://www.phpmyadmin.net
--
-- Хост: 127.0.0.1
-- Время создания: Мар 22 2019 г., 00:50
-- Версия сервера: 5.5.25
-- Версия PHP: 5.3.13

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- База данных: `integro`
--

-- --------------------------------------------------------

--
-- Структура таблицы `current_estimate`
--

CREATE TABLE IF NOT EXISTS `current_estimate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `rating_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=128 ;

--
-- Дамп данных таблицы `current_estimate`
--

INSERT INTO `current_estimate` (`id`, `user_id`, `subject_id`, `rating_id`) VALUES
(118, 3, 5, 4),
(121, 5, 4, 4),
(122, 3, 4, 4),
(123, 3, 2, 4),
(124, 1, 3, 3),
(125, 4, 1, 2),
(126, 3, 4, 4),
(127, 4, 4, 4);

-- --------------------------------------------------------

--
-- Структура таблицы `rating`
--

CREATE TABLE IF NOT EXISTS `rating` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `rating`
--

INSERT INTO `rating` (`id`, `name`) VALUES
(1, '2'),
(2, '3'),
(3, '4'),
(4, '5');

-- --------------------------------------------------------

--
-- Структура таблицы `subject`
--

CREATE TABLE IF NOT EXISTS `subject` (
  `id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `subject`
--

INSERT INTO `subject` (`id`, `subject`) VALUES
(1, 'Русский'),
(2, 'Английский'),
(3, 'Физика'),
(4, 'Теория игр'),
(5, 'Математика');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `patronomyc` varchar(255) NOT NULL,
  `surname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `name`, `patronomyc`, `surname`, `email`) VALUES
(1, 'Пётр', 'Павлович', 'Пупкин', 'pupkin@yandex.ru'),
(2, 'Павел', 'Павлович', 'Прускин', 'pruskin@yandex.ru'),
(3, 'Вазген', 'Вазгенович', 'Шашкин', 'shashkin@yandex.ru'),
(4, 'Илья', 'Ильич', 'Паприка', 'paprika@yandex.ru'),
(5, 'Фродо', 'Бильбо', 'Беггинс', 'beggins@yandex.ru');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
