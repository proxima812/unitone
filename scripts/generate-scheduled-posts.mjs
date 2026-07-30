import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	getArchivePublishDateKey,
	isArchiveEntryPublished,
} from "../src/lib/archivePublish.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "src/data/wordstat-keywords.json");
const archiveDir = path.join(rootDir, "src/content/archive");

const introByTopic = {
	program: "Запрос обычно появляется на первом этапе знакомства с 12-шаговой программой.",
	steps: "Отдельный шаг работает лучше, когда его читают как часть последовательной личной работы.",
	traditions: "Традиции защищают атмосферу, анонимность и устойчивость группы.",
	groups: "При выборе группы важны понятный формат, уважение к анонимности и отсутствие давления.",
	sponsorship: "Наставничество держится на опыте, доверии и границах, а не на власти.",
	spirituality: "Духовный язык в 12 шагах люди понимают по-разному, поэтому полезно искать практический смысл.",
	principles: "Принцип становится полезным, когда его можно перевести в конкретное действие сегодня.",
	practice: "Практические инструменты 12 шагов работают лучше, когда они простые, регулярные и честные.",
	codependency: "В теме созависимости важно отделять заботу от контроля и возвращать внимание к своей жизни.",
	family: "Для близких главный риск - пытаться управлять зависимым человеком вместо поиска собственной опоры.",
	addiction: "В теме зависимости 12 шагов стоит рассматривать как поддержку, а не как замену медицинской помощи.",
	recovery: "Выздоровление складывается из повторяемых действий: контакта, режима, честности и своевременной помощи.",
	literature: "Литература помогает структурировать опыт, но живой разговор часто делает текст понятнее.",
	support: "Поддержка работает лучше, когда в ней есть безопасность, границы и уважение к реальным возможностям.",
};

const actionByTopic = {
	program: "Начните с открытого собрания, списка шагов и трех вопросов, которые хочется уточнить.",
	steps: "Перепишите формулировку шага своими словами и обсудите ее с человеком, которому доверяете.",
	traditions: "Проверьте, помогает ли группа сохранять анонимность, равенство и ясные правила общения.",
	groups: "Перед первой встречей уточните формат, время, правила анонимности и возможность просто слушать.",
	sponsorship: "Заранее договоритесь о частоте связи, конфиденциальности и границах общения.",
	spirituality: "Выберите нейтральную практику: пауза, размышление, просьба о ясности или короткая запись.",
	principles: "Сформулируйте одно действие на день, через которое принцип станет видимым в поведении.",
	practice: "Пишите коротко: факт, чувство, ваша реакция и более трезвый следующий шаг.",
	codependency: "Запишите одну ситуацию, где вы берете на себя больше, чем реально можете контролировать.",
	family: "Спросите себя, что сегодня относится к вашей ответственности, а что принадлежит другому взрослому человеку.",
	addiction: "Составьте короткий список людей и мест, куда можно обратиться до кризиса.",
	recovery: "На сложный день заранее нужны три пункта: кому звонить, куда идти и чего избегать.",
	literature: "Читайте небольшими фрагментами и отмечайте то, что можно проверить на практике.",
	support: "Начинайте с безопасности и не оставайтесь в одиночку с острым риском.",
};

const relatedByTopic = {
	program: "/12-shagov/",
	steps: "/12-shagov/",
	traditions: "/archive/12-traditsiy-zachem-nuzhny-gruppe/",
	groups: "/communities/",
	sponsorship: "/archive/chto-takoe-nastavnichestvo-v-12-shagah/",
	spirituality: "/archive/vysshaya-sila-v-12-shagah/",
	principles: "/12-shagov/",
	practice: "/archive/kak-vesti-dnevnik-vosstanovleniya/",
	codependency: "/communities/",
	family: "/communities/",
	addiction: "/12-shagov/",
	recovery: "/archive/plan-podderzhki-na-slozhnyy-den/",
	literature: "/methods/",
	support: "/finder/",
};

function readQueue() {
	return JSON.parse(fs.readFileSync(dataPath, "utf8")).keywords || [];
}

function generatedPath(item) {
	return path.join(archiveDir, `${item.slug}.mdx`);
}

export function cleanupScheduledPosts() {
	let removed = 0;
	for (const item of readQueue()) {
		const filePath = generatedPath(item);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			removed += 1;
		}
	}
	return removed;
}

function yamlString(value) {
	return JSON.stringify(value);
}

function renderPost(item) {
	const intro = introByTopic[item.topic] || introByTopic.program;
	const action = actionByTopic[item.topic] || actionByTopic.program;
	const related = relatedByTopic[item.topic] || "/archive/";
	const tags = Array.isArray(item.tags) ? item.tags : ["12 шагов"];

	return `---
title: ${yamlString(item.title)}
description: ${yamlString(item.description)}
keywords: ${yamlString([item.keyword, ...tags, "Unity One"].join(", "))}
tags: [${tags.map(yamlString).join(", ")}]
author: ["Unity One"]
pubDate: ${item.pubDate}
---
## Почему люди ищут «${item.keyword}»
${intro} Важно не превращать этот запрос в обещание быстрого результата: в 12-шаговой среде ценятся личный опыт, добровольность и постепенность.

## Как смотреть на тему
Этот материал - заготовка вокруг ключевой фразы «${item.keyword}». Его задача не заменить группу, врача или личный разговор, а дать спокойную точку входа и помочь человеку понять, куда двигаться дальше.

Полезно держать в фокусе три ориентира:

1. Не нужно соглашаться со всем сразу.
2. Безопасность и здоровье важнее любых формулировок.
3. Живой контакт с группой или специалистом надежнее одиночного чтения.

## Практический ориентир
${action}

Если тема откликается, откройте связанный раздел: [материалы Unity One](${related}). Программа взаимопомощи не заменяет медицинскую или кризисную помощь; при угрозе жизни и здоровью обращайтесь к специалистам и экстренным службам.
`;
}

export function generateScheduledPosts(now = new Date()) {
	const queue = readQueue();
	const duePosts = queue.filter((item) =>
		isArchiveEntryPublished({ data: { pubDate: item.pubDate } }, now),
	);

	for (const item of duePosts) {
		fs.writeFileSync(generatedPath(item), renderPost(item), "utf8");
	}

	return { generated: duePosts.length, today: getArchivePublishDateKey(now) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const shouldClean = process.argv.includes("--clean");
	if (shouldClean) {
		const removed = cleanupScheduledPosts();
		console.log(`Removed ${removed} scheduled archive posts.`);
	} else {
		const result = generateScheduledPosts();
		console.log(`Generated ${result.generated} scheduled archive posts for ${result.today}.`);
	}
}
