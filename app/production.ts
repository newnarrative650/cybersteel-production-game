export type Step = { id: string; operation: string; title: string; sourceStep: string };
export type Tube = { id: string; title: string; industry: string; description: string; source: string; steps: Step[] };
const step = (id: string, operation: string, title: string, sourceStep: string): Step => ({ id, operation, title, sourceStep });
const blank = () => step("blank", "blank", "Горячедеформированная заготовка", "Вводная по пункту 1");
export const tubes: Tube[] = [
  { id: "nuclear", title: "Трубы для АЭС", industry: "ЭНЕРГЕТИКА", description: "Длинномерные трубы. Точность на каждом этапе.", source: "https://cybersteel.com/technologies/long-tubes-for-nuclear-power-stations/",
    steps: [blank(),
      step("bore","boring","Растачивание внутренней поверхности заготовки","1.3"),
      step("heat-1","heat","Термообработка","1.6"),
      step("descale-1","descale","Удаление окалины","1.7"),
      step("hpt","hpt","Прокатка на станах ХПТ","3"),
      step("heat-2","heat","Термообработка","5"),
      step("descale-2","descale","Удаление окалины","6"),
      step("hpt-1045","hpt-1045","Прокатка на стане ХПТ 10–45","11"),
      step("heat-3","heat","Термообработка","13"),
      step("vision","vision","Проверка наружной поверхности машинным зрением","17"),
      step("endoscope","endoscope","Эндоскопический контроль внутренней поверхности","19")
    ] },
  { id: "general", title: "Трубы общего назначения", industry: "ПРОМЫШЛЕННОСТЬ", description: "Диаметр более 20 мм. Основы производства.", source: "https://cybersteel.com/technologies/truby-obshchego-naznacheniya-bolee-20mm/",
    steps: [blank(),
      step("descale-1","descale","Удаление окалины","1.1"),
      step("straight-1","straight","Правка","1.2"),
      step("trim-1","trim","Подрезка торцов","1.3"),
      step("grease","grease","Нанесение технологической смазки","2"),
      step("hpt","hpt","Прокатка на станах ХПТ","3"),
      step("heat","heat","Термообработка","5"),
      step("descale-2","descale","Удаление окалины","6"),
      step("straight-2","straight","Правка","7"),
      step("trim-2","trim","Подрезка торцов","8"),
      step("ultrasound","ultrasound","Ультразвуковой контроль","12")
    ] },
  { id: "aviation", title: "Трубы для авиации", industry: "АВИАСТРОЕНИЕ", description: "Сложная обработка. Особые требования к качеству.", source: "https://cybersteel.com/technologies/tubes-for-aviation/",
    steps: [blank(),
      step("bore","boring","Растачивание внутренней поверхности заготовки","1.3"),
      step("grind-1","grind","Шлифование наружной поверхности","1.4"),
      step("hpt","hpt","Прокатка на станах ХПТ","3"),
      step("shot-1","shot","Дробеструйная обработка внутренней поверхности","11"),
      step("hptr","hptr","Прокатка на станах ХПТР","12"),
      step("heads","heads","Забивка волочильных головок","14"),
      step("drawing","drawing","Волочение труб","16"),
      step("shot-2","shot","Дробеструйная обработка внутренней поверхности","24"),
      step("grind-2","grind","Шлифование наружной поверхности","25"),
      step("ultrasound","ultrasound","Ультразвуковой контроль","28")
    ] }
];
export function technologyText(title: string): string {
  return `Текст здесь рассказывает про технологию «${title}» и зачем она нужна.`;
}
