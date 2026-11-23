"""Generate the Posadmin digital brand guide. Run from any directory.

Requires reportlab. Uses existing local Inter fonts and Posadmin logo.
Output: output/pdf/posadmin-brandbook.pdf (8 pages, landscape digital format).
"""
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1200, 800
M = 72
NAVY, CREAM, GRAY, BLUE, GREEN = "#364C84", "#FFFDF5", "#F1F2F0", "#95B1EE", "#E7F1A8"
FONTS = ROOT / "assets" / "fonts" / "pdf"
pdfmetrics.registerFont(TTFont("Inter", str(FONTS / "Inter-Regular.ttf")))
pdfmetrics.registerFont(TTFont("InterMedium", str(FONTS / "Inter-Medium.ttf")))

C = canvas.Canvas(str(OUT / "posadmin-brandbook.pdf"), pagesize=(W, H), pageCompression=1)
C.setTitle("Posadmin — цифровой брендбук v0.1")
C.setAuthor("Posadmin")
C.setSubject("Рекомендованная визуальная система: палитра, типографика, интерфейс и коммуникация")
C.setCreator("Posadmin digital brand guide / generate-brandbook.py")


def rect(x, top, width, height, color, radius=0):
    C.setFillColor(HexColor(color))
    if radius:
        C.roundRect(x, H-top-height, width, height, radius, fill=1, stroke=0)
    else:
        C.rect(x, H-top-height, width, height, fill=1, stroke=0)


def txt(value, x, top, size=18, color=NAVY, weight=400, align="left"):
    font = "InterMedium" if weight == 500 else "Inter"
    C.setFillColor(HexColor(color))
    C.setFont(font, size)
    baseline = H-top-size*.82
    if align == "right":
        C.drawRightString(x, baseline, value)
    else:
        C.drawString(x, baseline, value)


def para(value, x, top, width, size=18, color=NAVY, leading=None, weight=400, maxheight=None):
    style = ParagraphStyle("body", fontName="InterMedium" if weight == 500 else "Inter",
                           fontSize=size, leading=leading or size*1.52,
                           textColor=HexColor(color), spaceAfter=0, allowWidows=0,
                           allowOrphans=0, splitLongWords=False)
    paragraph = Paragraph(escape(value).replace("\n", "<br/>"), style)
    _, height = paragraph.wrap(width, H)
    if maxheight is not None and height > maxheight:
        raise ValueError(f"Overflow {height:.1f}>{maxheight}: {value[:65]}")
    if top+height > 738:
        raise ValueError(f"Footer collision at {top+height:.1f}: {value[:65]}")
    paragraph.drawOn(C, x, H-top-height)
    return height


def logo(x, top, width=132, color=NAVY):
    root = ET.parse(ROOT / "assets" / "pdf" / "posadmin-logo.svg").getroot()
    scale = width / float(root.attrib["width"])
    C.saveState()
    C.translate(x, H-top)
    C.scale(scale, -scale)
    C.setFillColor(HexColor(color))
    for element in root.iter():
        kind = element.tag.rsplit("}", 1)[-1]
        if kind == "circle":
            C.circle(float(element.attrib["cx"]), float(element.attrib["cy"]),
                     float(element.attrib["r"]), fill=1, stroke=0)
        elif kind == "path":
            # The source logo uses only absolute M/H/V/C/Z commands.
            tokens = re.findall(r"[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?", element.attrib["d"])
            p = C.beginPath()
            index = 0
            px = py = 0
            while index < len(tokens):
                command = tokens[index]
                index += 1
                if command == "M":
                    px, py = map(float, tokens[index:index+2]); index += 2
                    p.moveTo(px, py)
                elif command == "H":
                    px = float(tokens[index]); index += 1
                    p.lineTo(px, py)
                elif command == "V":
                    py = float(tokens[index]); index += 1
                    p.lineTo(px, py)
                elif command == "C":
                    args = list(map(float, tokens[index:index+6])); index += 6
                    p.curveTo(*args); px, py = args[4:]
                elif command == "Z":
                    p.close()
                else:
                    raise ValueError(f"Unsupported SVG command in source logo: {command}")
            C.drawPath(p, fill=1, stroke=0)
    C.restoreState()


def dot(x, top, radius=4, color=BLUE):
    C.setFillColor(HexColor(color))
    C.circle(x, H-top, radius, fill=1, stroke=0)


def arrow(x, top, length=22, color=NAVY):
    C.setStrokeColor(HexColor(color))
    C.setLineWidth(1.4)
    C.line(x, H-top, x+length, H-top)
    C.line(x+length-5, H-top+5, x+length, H-top)
    C.line(x+length-5, H-top-5, x+length, H-top)


def label(value, x, top, color=NAVY):
    txt(value.upper(), x, top, 11, color, 500)


def header(page, section):
    rect(0, 0, W, H, CREAM)
    logo(M, 38, 118)
    txt(section, W-M, 41, 12, align="right")
    txt("POSADMIN / DIGITAL BRAND GUIDE / v0.1", M, 760, 10)
    txt(f"16.11.2026     {page:02d} / 08", W-M, 760, 10, align="right")


def title(kicker, heading, top=111, size=42, width=1056):
    label(kicker, M, top)
    return para(heading, M, top+30, width, size, leading=size*1.14, weight=500)


def button(value, x, top, width, height=48, filled=True, size=15):
    rect(x, top, width, height, NAVY if filled else GRAY, 8)
    txt(value, x+18, top+(height-size)/2, size, CREAM if filled else NAVY)
    arrow(x+width-38, top+height/2, 17, CREAM if filled else NAVY)


def source_link(label_value, url, x, top, size=11):
    txt(label_value, x, top, size)
    width = pdfmetrics.stringWidth(label_value, "Inter", size)
    C.linkURL(url, (x, H-top-size*1.2, x+width, H-top+3), relative=0, thickness=0)


# 01 — Cover
rect(0, 0, W, H, NAVY)
logo(M, 61, 245, CREAM)
label("Рекомендованная визуальная система / v0.1", M, 137, CREAM)
para("Одна команда.\nВесь технологический\nконтур.", M, 211, 900, 61, CREAM, 69, 500)
para("Posadmin соединяет сопровождение ресторанного бизнеса\nи собственные программные продукты. Визуальный язык\nдолжен одинаково уверенно говорить о людях и технологиях.",
     M, 474, 730, 20, CREAM, 31)
rect(931, 468, 197, 197, BLUE, 12)
rect(984, 521, 91, 91, NAVY, 8)
txt("Цифровой брендбук", M, 678, 21, CREAM)
txt("Стратегия · Цвет · Типографика · Интерфейс · Движение", M, 715, 13, CREAM)
txt("16.11.2026", W-M, 750, 12, CREAM, align="right")
C.showPage()

# 02 — Strategy and business
header(2, "Позиционирование")
title("01 / Задача бренда", "Серьёзный партнёр.\nСовременное программное обеспечение.", size=40)
para("Рекомендую сохранить выбранные цвета, но изменить их вес: тёмно-синий становится основой, кремовый и нейтральный серый дают спокойный фон. Голубой работает как редкий продуктовый акцент.", M, 269, 620, 19, maxheight=128)
para("Это дизайнерская оценка для Posadmin, а не универсальное утверждение о психологии цвета. Равный вес ярких пастельных пятен сделал бы образ более игровым, чем требуется компании.", 765, 271, 363, 16, maxheight=136)
rect(M, 437, 1056, 112, GRAY, 10)
label("01 / Команда", M+24, 460)
txt("Сопровождение и запуск", M+24, 490, 25, weight=500)
para("Автоматизация HoReCa, поддержка 24/7,\nr_keeper, 1С, ККТ, ГИС и IT-инфраструктура.", 643, 468, 455, 18, maxheight=72)
label("02 / Продукты", M+24, 588)
txt("Собственные решения", M+24, 618, 25, weight=500)
para("ReZebra, FlexBonusb и FoxControl.\nБронирование, лояльность и контроль операций.", 643, 596, 455, 18, maxheight=72)
para("Общий принцип: ясная структура, конкретная польза и один узнаваемый визуальный язык.", M, 704, 1030, 15)
C.showPage()

# 03 — Palette
header(3, "Палитра и контраст")
title("02 / Цветовая система", "Пять цветов. Разные роли.", size=42)
swatches = [
    ("Кремовый", CREAM, "Основа страницы"),
    ("Нейтральный серый", GRAY, "Группировка и подложки"),
    ("Тёмно-синий", NAVY, "Текст, меню, основная кнопка"),
    ("Голубой", BLUE, "Иллюстрации и крупный акцент"),
    ("Светло-зелёный", GREEN, "Редкая точка статуса"),
]
for index, (name, color, role) in enumerate(swatches):
    x=M+index*216
    # Cream is shown against the approved neutral background, without an outline.
    if index == 0:
        rect(x, 226, 192, 148, GRAY, 10)
        rect(x+10, 236, 172, 128, color, 7)
    else:
        rect(x, 226, 192, 148, color, 10)
    txt(name, x, 396, 16, weight=500)
    txt(color, x, 424, 18)
    para(role, x, 459, 193, 13, maxheight=42)
label("Пример визуального баланса, не обязательная норма", M, 529)
weights=[60,20,15,4,1]
cursor=M
for (_, color, _), weight in zip(swatches, weights):
    rect(cursor, 555, 1056*weight/100, 28, color)
    cursor+=1056*weight/100
txt("60% кремовый    20% серый    15% тёмно-синий    4% голубой    1% зелёный", M, 601, 14)
txt("8.17:1", M, 646, 28, weight=500)
txt("navy / cream · обычный текст", M, 685, 13)
txt("6.95:1", 432, 646, 28, weight=500)
txt("navy / green · короткий статус", 432, 685, 13)
txt("3.88:1", 792, 646, 28, weight=500)
txt("navy / blue · только крупный текст", 792, 685, 13)
source_link("AA: от 4.5:1 для обычного текста; от 3:1 для крупного [1]", "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html", M, 720, 11)
C.showPage()

# 04 — Type
header(4, "Типографика")
title("03 / Шрифт", "Inter. Спокойная, ясная иерархия.", size=42)
txt("Aa", M, 235, 142)
txt("Аа Бб Вв Гг Дд Ёё", M+5, 406, 29)
txt("0123456789  /  ₽  +  %", M+5, 458, 27)
para("400 Regular - основной текст и кнопки.\n500 Medium - заголовки и важные значения.\nБез искусственного сжатия букв.", M+5, 526, 440, 17, maxheight=115)
rows=[("H1 / Первый экран", "48–64 px", "1.10–1.20"),
      ("H2 / Раздел", "36–48 px", "1.15–1.25"),
      ("H3 / Подраздел", "22–28 px", "1.20–1.30"),
      ("Основной текст", "16 px", "1.55–1.70"),
      ("Вспомогательный", "14 px", "1.50–1.65"),
      ("Метки и подписи", "12 px", "1.40–1.60"),
      ("Кнопки", "14–16 px", "1.25–1.40")]
label("Роль", 590, 240)
label("Размер", 875, 240)
label("Интерлиньяж", 1004, 240)
for i,(role,size,lh) in enumerate(rows):
    y=276+i*51
    if i%2==0:
        rect(570,y-9,558,42,GRAY,5)
    txt(role,590,y,16)
    txt(size,875,y,16)
    txt(lh,1004,y,16)
para("На мобильном: H1 36–44 px, H2 30–36 px; основной текст остаётся 16 px. Длинные строки ограничиваем примерно 55–75 знаками. Цифры в расчётах выравниваем по разрядам.", 590, 660, 538, 14, maxheight=72)
source_link("Inter / локальные файлы шрифта / SIL Open Font License [3]", "https://github.com/google/fonts/tree/main/ofl/inter", M, 704, 11)
C.showPage()

# 05 — UI
header(5, "Интерфейс и композиция")
title("04 / Применение", "Содержание ведёт. Интерфейс помогает.", size=41)
rect(M,224,668,351,GRAY,12)
rect(M+24,246,620,54,NAVY,8)
logo(M+42,265,104,CREAM)
txt("Сопровождение",M+220,266,12,CREAM)
txt("Проект",M+362,266,12,CREAM)
txt("Продукты",M+446,266,12,CREAM)
txt("Контакты",M+539,266,12,CREAM)
para("Технологии работают.\nВы занимаетесь своим делом.",M+32,330,550,30,leading=37,weight=500)
para("Автоматизация, сопровождение и собственные\nпродукты для ресторанного бизнеса.",M+32,425,560,16,leading=24)
button("Обсудить проект",M+32,503,210,46,size=14)
txt("Подробнее о компании",M+267,518,14)
arrow(M+462,525,20)
label("Контент / пример", M, 609)
para("01  Формат предприятия",M,635,350,20,weight=500)
para("02  Состав работ",M,670,350,20,weight=500)
para("03  Расчёт",M,705,350,20,weight=500)
para("Ширина контента: до 1200 px.\nМежду разделами: 120–176 px;\nна мобильном: 72–88 px.\nВнутри группы: 24 / 32 / 48 px.",M+382,637,286,13,leading=23,maxheight=94)
for top,n,heading,body in [
    (234,"01","Иерархия без рамок","Группы разделяются фоном и пространством. Не превращаем каждый абзац в отдельную карточку."),
    (387,"02","Одно главное действие","Основная кнопка: navy + cream. Ссылки обозначаем стрелкой и контекстом, без подчёркиваний."),
    (548,"03","Состояния понятны","Фокус: сплошная заливка и явный маркер. Ошибка или успех описаны текстом, а не только цветом [2].")]:
    label(n,794,top)
    txt(heading,794,top+27,20,weight=500)
    para(body,794,top+66,334,16,maxheight=100)
C.showPage()

# 06 — Motion and tone
header(6, "Движение и голос бренда")
title("05 / Поведение", "Движение объясняет, а не отвлекает.", size=41)
rect(M,232,1056,145,GRAY,10)
txt("200–400 мс", M+28,259,43,weight=500)
txt("Появление группы элементов",M+28,322,16)
txt("8–16 px",454,259,43,weight=500)
txt("Небольшое смещение",454,322,16)
txt("0–60 мс",819,259,43,weight=500)
txt("Пауза между группами",819,322,16)
para("Предлагаемые параметры, не универсальный стандарт. Анимация доигрывает плавно и не привязана к каждому пикселю скролла. При возврате вверх - максимум мягкое повторение без скачков.",M,404,636,17,maxheight=105)
para("prefers-reduced-motion\nУбираем перемещения и параллакс. Содержимое и действия доступны сразу. Прозрачность допустима лишь временно при появлении.",792,405,336,15,maxheight=117)
label("Голос / конкретно и по делу",M,556)
para("Настроим кассы и учёт.\nПоможем запустить предприятие\nи останемся на связи.",M,589,610,28,leading=38,weight=500)
label("Избегаем",792,556)
para("Обещаний без подтверждения,\nсверхсложных терминов и лозунгов\nпро «революционные экосистемы».",792,590,336,16,maxheight=100)
C.showPage()

# 07 — Identity and architecture
header(7, "Логотип и архитектура")
title("06 / Узнаваемость", "Один бренд. Два направления.", size=42)
rect(M,232,495,214,GRAY,12)
logo(M+61,316,372,NAVY)
txt("x",M+25,328,16)
txt("x",M+245,256,16)
para("Действующий знак сохраняем. Предлагаемое охранное поле: не меньше высоты знака x со всех сторон. Минимальная ширина в интерфейсе - 120 px; проверяем читаемость на устройстве.",M,473,495,16,maxheight=122)
para("Монохром: navy на cream/gray; cream на navy.\nБез новых эффектов, свечения, теней и деформации.",M,632,495,15,maxheight=67)
label("Posadmin",643,239)
txt("Сопровождение и автоматизация",643,273,24,weight=500)
para("Запуск предприятия, поддержка 24/7, интеграции\nи работа технической команды.",643,315,485,16,maxheight=58)
label("Собственные продукты",643,417)
items=[("ReZebra","Бронирования и работа с гостями"),
       ("FlexBonusb","Программа лояльности"),
       ("FoxControl","Контроль операций")]
for i,(name,desc) in enumerate(items):
    y=456+i*73
    txt(name,643,y,23,weight=500)
    txt(desc,643,y+33,15)
txt("Общий шрифт, навигация и правила взаимодействия.",643,704,13)
C.showPage()

# 08 — Rollout and references
header(8,"Внедрение и источники")
title("07 / Внедрение", "Последовательность важнее декора.",size=42)
left_steps=[
    ("01","Зафиксировать токены","Пять цветов, роли, типографика и интервалы в одном месте."),
    ("02","Обновить компоненты","Меню, кнопки, поля, модальные окна и расчёты следуют одним правилам."),
    ("03","Проверить весь маршрут","Главная, «О нас», продукты, контакты и PDF выглядят как одна компания.")]
for i,(num,head,body) in enumerate(left_steps):
    y=240+i*119
    label(num,M,y)
    txt(head,M+44,y-4,23,weight=500)
    para(body,M+44,y+35,492,16,maxheight=57)
rect(727,231,401,342,GRAY,12)
label("Перед публикацией",755,259)
checks=["Мелкий текст - navy на cream/gray.","Зелёный не становится фоном секций.","Нет обводок, стекла и свечений.","Действия доступны с клавиатуры.","Мобильная версия без тесных строк.","Снижение движения учитывается."]
for i,item in enumerate(checks):
    dot(762,307+i*39,3,NAVY)
    txt(item,776,299+i*39,14)
label("Источники и статус документа",M,618)
source_link("[1] W3C / WCAG 2.2 / Contrast (Minimum)","https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",M,646,12)
source_link("[2] W3C / WCAG 2.2 / Use of Color","https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html",M,673,12)
source_link("[3] Google Fonts / Inter / OFL","https://github.com/google/fonts/tree/main/ofl/inter",M,700,12)
para("v0.1 - предлагаемые правила цифрового бренда.\nФакты о направлениях и знак взяты из проекта Posadmin.\nЧисла контраста рассчитаны по sRGB/WCAG.\nРазмеры и доли - рекомендации для дизайна, не стандарт.",727,638,401,12,leading=20,maxheight=84)
C.showPage()
C.save()
print(f"Created {OUT / 'posadmin-brandbook.pdf'}")
