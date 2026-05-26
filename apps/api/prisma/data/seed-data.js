"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const dosageForms = [
    {
        id: 'seed-dosage-tablet',
        name: '정제',
        description: '일반 고형제 기준 제형',
        isKolmarSpecial: false,
    },
    {
        id: 'seed-dosage-chewable-tablet',
        name: '츄어블 정제',
        description: '관능, 붕해, 안정성 검토가 필요한 콜마 특화 고형제 예시',
        isKolmarSpecial: true,
    },
    {
        id: 'seed-dosage-powder',
        name: '분말',
        description: '스틱 포장과 배합 균일성 검토가 필요한 분말 제형',
        isKolmarSpecial: false,
    },
    {
        id: 'seed-dosage-liquid',
        name: '액상',
        description: '흡수율이 높고 맛 관능이 중요한 액상 제형',
        isKolmarSpecial: true,
    },
    {
        id: 'seed-dosage-hard-capsule',
        name: '경질캡슐',
        description: '분말이나 과립을 충전한 캡슐',
        isKolmarSpecial: false,
    },
    {
        id: 'seed-dosage-soft-capsule',
        name: '연질캡슐',
        description: '지용성 성분 충전에 유리한 캡슐',
        isKolmarSpecial: false,
    },
    {
        id: 'seed-dosage-jelly',
        name: '젤리',
        description: '섭취 편의성을 높인 젤리 제형',
        isKolmarSpecial: true,
    },
];
const packagingOptions = [
    {
        id: 'seed-packaging-ptp',
        name: 'PTP 개별 포장',
        description: '정제/츄어블 정제 안정성 테스트 기준 포장',
        isKolmarSpecial: true,
    },
    {
        id: 'seed-packaging-stick',
        name: '스틱 포장',
        description: '분말/액상/젤리 제품 관능 및 흡습 안정성 테스트 기준 포장',
        isKolmarSpecial: true,
    },
    {
        id: 'seed-packaging-bottle',
        name: '병 포장',
        description: '대용량 포장에 적합한 일반적인 병',
        isKolmarSpecial: false,
    },
    {
        id: 'seed-packaging-blister',
        name: '블리스터 포장',
        description: '캡슐 및 정제 보호용',
        isKolmarSpecial: false,
    },
];
const ingredients = [
    {
        id: 'seed-ingredient-vitamin-c',
        name: '비타민 C',
        description: '산미와 항산화 특성을 함께 고려하는 고형제 기준 원료',
    },
    {
        id: 'seed-ingredient-zinc',
        name: '아연',
        description: '기준 규격과 섭취 상한 검토가 필요한 미네랄 원료',
    },
    {
        id: 'seed-ingredient-theanine',
        name: '테아닌',
        description: '관능과 기능성을 함께 검토하는 아미노산 계열 원료',
    },
    {
        id: 'seed-ingredient-magnesium',
        name: '마그네슘',
        description: '배합량 증가 시 맛과 장용성 이슈를 확인해야 하는 원료',
    },
    {
        id: 'seed-ingredient-ginseng',
        name: '홍삼농축액',
        description: '면역력 증진, 피로개선 기능성. 특유의 쓴맛 차폐 기술 필요',
    },
    {
        id: 'seed-ingredient-probiotics',
        name: '프로바이오틱스',
        description: '유산균 증식 및 유해균 억제. 습도와 온도에 매우 민감',
    },
    {
        id: 'seed-ingredient-lutein',
        name: '루테인 (마리골드꽃추출물)',
        description: '눈 건강 기능성. 지용성 원료로 연질캡슐에 적합',
    },
    {
        id: 'seed-ingredient-collagen',
        name: '저분자 피쉬콜라겐',
        description: '피부 건강 보조. 특유의 비린맛 마스킹 필요',
    },
    {
        id: 'seed-ingredient-calcium',
        name: '칼슘',
        description: '뼈 건강 원료. 흡수율과 위장장애 이슈 검토 필요',
    },
    {
        id: 'seed-ingredient-vitamin-d',
        name: '비타민 D',
        description: '칼슘 흡수 보조. 지용성 비타민',
    },
];
const formulaIngredients = [
    {
        id: 'seed-formula-ingredient-vitamin-c',
        ingredientId: 'seed-ingredient-vitamin-c',
        amount: '500',
        unit: 'mg',
        ratio: '40',
        role: '산미/항산화 기준 원료',
    },
    {
        id: 'seed-formula-ingredient-zinc',
        ingredientId: 'seed-ingredient-zinc',
        amount: '8',
        unit: 'mg',
        ratio: '1',
        role: '기준 규격 및 상한 확인 원료',
    },
    {
        id: 'seed-formula-ingredient-theanine',
        ingredientId: 'seed-ingredient-theanine',
        amount: '200',
        unit: 'mg',
        ratio: '16',
        role: '관능 안정성 확인 원료',
    },
];
const fatigueFormulaIngredients = [
    {
        id: 'seed-formula-ingredient-ginseng',
        ingredientId: 'seed-ingredient-ginseng',
        amount: '1000',
        unit: 'mg',
        ratio: '50',
        role: '주기능성원료',
    },
    {
        id: 'seed-formula-ingredient-vitamin-c-2',
        ingredientId: 'seed-ingredient-vitamin-c',
        amount: '100',
        unit: 'mg',
        ratio: '5',
        role: '항산화 보조',
    },
    {
        id: 'seed-formula-ingredient-theanine-2',
        ingredientId: 'seed-ingredient-theanine',
        amount: '200',
        unit: 'mg',
        ratio: '10',
        role: '스트레스 완화 시너지',
    },
];
const eyeFormulaIngredients = [
    {
        id: 'seed-formula-ingredient-lutein',
        ingredientId: 'seed-ingredient-lutein',
        amount: '20',
        unit: 'mg',
        ratio: '12',
        role: '눈 건강 주원료',
    },
    {
        id: 'seed-formula-ingredient-vitamin-d-eye',
        ingredientId: 'seed-ingredient-vitamin-d',
        amount: '10',
        unit: 'ug',
        ratio: '1',
        role: '지용성 보조 원료',
    },
];
const boneFormulaIngredients = [
    {
        id: 'seed-formula-ingredient-calcium',
        ingredientId: 'seed-ingredient-calcium',
        amount: '300',
        unit: 'mg',
        ratio: '35',
        role: '뼈 건강 주원료',
    },
    {
        id: 'seed-formula-ingredient-vitamin-d-bone',
        ingredientId: 'seed-ingredient-vitamin-d',
        amount: '10',
        unit: 'ug',
        ratio: '1',
        role: '칼슘 흡수 보조',
    },
    {
        id: 'seed-formula-ingredient-magnesium-bone',
        ingredientId: 'seed-ingredient-magnesium',
        amount: '100',
        unit: 'mg',
        ratio: '12',
        role: '미네랄 밸런스 보조',
    },
];
async function upsertSeedData(prisma) {
    for (const dosageForm of dosageForms) {
        await prisma.dosageForm.upsert({
            where: { id: dosageForm.id },
            update: {
                description: dosageForm.description,
                isKolmarSpecial: dosageForm.isKolmarSpecial,
                name: dosageForm.name,
            },
            create: dosageForm,
        });
    }
    for (const packagingOption of packagingOptions) {
        await prisma.packagingOption.upsert({
            where: { id: packagingOption.id },
            update: {
                description: packagingOption.description,
                isKolmarSpecial: packagingOption.isKolmarSpecial,
                name: packagingOption.name,
            },
            create: packagingOption,
        });
    }
    for (const ingredient of ingredients) {
        await prisma.ingredient.upsert({
            where: { id: ingredient.id },
            update: { description: ingredient.description, name: ingredient.name },
            create: ingredient,
        });
    }
    await prisma.product.upsert({
        where: { id: 'seed-product-kolmar-solid-baseline' },
        update: {
            category: '건강기능식품',
            description: '신물 억제 고형제 개발의 기준으로 삼는 콜마 특화 츄어블 처방',
            dosageFormId: 'seed-dosage-chewable-tablet',
            function: '신물 억제 보조',
            name: '콜마 고형제 기준 처방',
            packagingId: 'seed-packaging-ptp',
            referenceNote: '비타민 C 산미와 아연 관능 이슈를 함께 확인',
            status: 'UNDER_REVIEW',
            target: '위 건강',
        },
        create: {
            id: 'seed-product-kolmar-solid-baseline',
            category: '건강기능식품',
            description: '신물 억제 고형제 개발의 기준으로 삼는 콜마 특화 츄어블 처방',
            dosageFormId: 'seed-dosage-chewable-tablet',
            function: '신물 억제 보조',
            name: '콜마 고형제 기준 처방',
            packagingId: 'seed-packaging-ptp',
            referenceNote: '비타민 C 산미와 아연 관능 이슈를 함께 확인',
            status: 'UNDER_REVIEW',
            target: '위 건강',
        },
    });
    await prisma.productFormula.upsert({
        where: { id: 'seed-formula-kolmar-solid-baseline-v1' },
        update: {
            note: '고형제 중심 PoC 기준 처방 데이터',
            productId: 'seed-product-kolmar-solid-baseline',
            version: 'v1',
        },
        create: {
            id: 'seed-formula-kolmar-solid-baseline-v1',
            note: '고형제 중심 PoC 기준 처방 데이터',
            productId: 'seed-product-kolmar-solid-baseline',
            version: 'v1',
        },
    });
    for (const fi of formulaIngredients) {
        await prisma.productFormulaIngredient.upsert({
            where: { id: fi.id },
            update: {
                amount: fi.amount,
                formulaId: 'seed-formula-kolmar-solid-baseline-v1',
                ingredientId: fi.ingredientId,
                ratio: fi.ratio,
                role: fi.role,
                unit: fi.unit,
            },
            create: { ...fi, formulaId: 'seed-formula-kolmar-solid-baseline-v1' },
        });
    }
    await prisma.product.upsert({
        where: { id: 'seed-product-fatigue-jelly' },
        update: {
            category: '건강기능식품',
            description: '홍삼 쓴맛 마스킹과 젤리 안정성을 함께 보는 출시 대기 제품',
            dosageFormId: 'seed-dosage-jelly',
            function: '피로 개선 및 스트레스 완화',
            name: '콜마 활력 젤리',
            packagingId: 'seed-packaging-stick',
            referenceNote: '스틱 포장 내 수분 활성도와 관능 테스트 필요',
            status: 'PENDING_RELEASE',
            target: '직장인',
        },
        create: {
            id: 'seed-product-fatigue-jelly',
            category: '건강기능식품',
            description: '홍삼 쓴맛 마스킹과 젤리 안정성을 함께 보는 출시 대기 제품',
            dosageFormId: 'seed-dosage-jelly',
            function: '피로 개선 및 스트레스 완화',
            name: '콜마 활력 젤리',
            packagingId: 'seed-packaging-stick',
            referenceNote: '스틱 포장 내 수분 활성도와 관능 테스트 필요',
            status: 'PENDING_RELEASE',
            target: '직장인',
        },
    });
    await prisma.productFormula.upsert({
        where: { id: 'seed-formula-fatigue-jelly-v1' },
        update: {
            note: '홍삼 쓴맛을 마스킹한 젤리 기준 처방',
            productId: 'seed-product-fatigue-jelly',
            version: 'v1',
        },
        create: {
            id: 'seed-formula-fatigue-jelly-v1',
            note: '홍삼 쓴맛을 마스킹한 젤리 기준 처방',
            productId: 'seed-product-fatigue-jelly',
            version: 'v1',
        },
    });
    for (const fi of fatigueFormulaIngredients) {
        await prisma.productFormulaIngredient.upsert({
            where: { id: fi.id },
            update: {
                amount: fi.amount,
                formulaId: 'seed-formula-fatigue-jelly-v1',
                ingredientId: fi.ingredientId,
                ratio: fi.ratio,
                role: fi.role,
                unit: fi.unit,
            },
            create: { ...fi, formulaId: 'seed-formula-fatigue-jelly-v1' },
        });
    }
    await prisma.product.upsert({
        where: { id: 'seed-product-eye-softgel' },
        update: {
            category: '건강기능식품',
            description: '지용성 루테인을 연질캡슐로 안정화한 출시 제품',
            dosageFormId: 'seed-dosage-soft-capsule',
            function: '눈 건강',
            name: '루테인 아이케어 연질캡슐',
            packagingId: 'seed-packaging-blister',
            referenceNote: '산패 지표와 캡슐 피막 안정성 확인',
            status: 'RELEASED',
            target: '디지털 작업자',
        },
        create: {
            id: 'seed-product-eye-softgel',
            category: '건강기능식품',
            description: '지용성 루테인을 연질캡슐로 안정화한 출시 제품',
            dosageFormId: 'seed-dosage-soft-capsule',
            function: '눈 건강',
            name: '루테인 아이케어 연질캡슐',
            packagingId: 'seed-packaging-blister',
            referenceNote: '산패 지표와 캡슐 피막 안정성 확인',
            status: 'RELEASED',
            target: '디지털 작업자',
        },
    });
    await prisma.productFormula.upsert({
        where: { id: 'seed-formula-eye-softgel-v1' },
        update: {
            note: '지용성 루테인 연질캡슐 기준 처방',
            productId: 'seed-product-eye-softgel',
            version: 'v1',
        },
        create: {
            id: 'seed-formula-eye-softgel-v1',
            note: '지용성 루테인 연질캡슐 기준 처방',
            productId: 'seed-product-eye-softgel',
            version: 'v1',
        },
    });
    for (const fi of eyeFormulaIngredients) {
        await prisma.productFormulaIngredient.upsert({
            where: { id: fi.id },
            update: {
                amount: fi.amount,
                formulaId: 'seed-formula-eye-softgel-v1',
                ingredientId: fi.ingredientId,
                ratio: fi.ratio,
                role: fi.role,
                unit: fi.unit,
            },
            create: { ...fi, formulaId: 'seed-formula-eye-softgel-v1' },
        });
    }
    await prisma.product.upsert({
        where: { id: 'seed-product-bone-tablet' },
        update: {
            category: '건강기능식품',
            description: '칼슘과 비타민 D 균형을 검토하던 판매 중단 기준 처방',
            dosageFormId: 'seed-dosage-tablet',
            function: '뼈 건강',
            name: '칼슘 밸런스 정제',
            packagingId: 'seed-packaging-bottle',
            referenceNote: '위장 부담 관련 클레임 이력으로 신규 프로젝트 참고용',
            status: 'DISCONTINUED',
            target: '중장년',
        },
        create: {
            id: 'seed-product-bone-tablet',
            category: '건강기능식품',
            description: '칼슘과 비타민 D 균형을 검토하던 판매 중단 기준 처방',
            dosageFormId: 'seed-dosage-tablet',
            function: '뼈 건강',
            name: '칼슘 밸런스 정제',
            packagingId: 'seed-packaging-bottle',
            referenceNote: '위장 부담 관련 클레임 이력으로 신규 프로젝트 참고용',
            status: 'DISCONTINUED',
            target: '중장년',
        },
    });
    await prisma.productFormula.upsert({
        where: { id: 'seed-formula-bone-tablet-v1' },
        update: {
            note: '칼슘과 비타민 D 흡수 균형을 보는 정제 기준 처방',
            productId: 'seed-product-bone-tablet',
            version: 'v1',
        },
        create: {
            id: 'seed-formula-bone-tablet-v1',
            note: '칼슘과 비타민 D 흡수 균형을 보는 정제 기준 처방',
            productId: 'seed-product-bone-tablet',
            version: 'v1',
        },
    });
    for (const fi of boneFormulaIngredients) {
        await prisma.productFormulaIngredient.upsert({
            where: { id: fi.id },
            update: {
                amount: fi.amount,
                formulaId: 'seed-formula-bone-tablet-v1',
                ingredientId: fi.ingredientId,
                ratio: fi.ratio,
                role: fi.role,
                unit: fi.unit,
            },
            create: { ...fi, formulaId: 'seed-formula-bone-tablet-v1' },
        });
    }
    await prisma.developmentProject.upsert({
        where: { id: 'seed-project-reflux-tablet' },
        update: {
            background: '위 건강 개선을 원하는 소비자 수요 증가로 기준 처방 개선 필요',
            desiredForm: '츄어블 정제',
            function: '신물 억제 보조',
            goal: '기준 처방을 바탕으로 맛, 색, 붕해 안정성을 개선한다.',
            name: '신물 억제 고형제 개발',
            objective: '비타민 C 산미와 아연 관능을 개선한 츄어블 정제 처방 확정',
            sourceFormulaId: 'seed-formula-kolmar-solid-baseline-v1',
            sourceProductId: 'seed-product-kolmar-solid-baseline',
            target: '위 건강',
        },
        create: {
            id: 'seed-project-reflux-tablet',
            background: '위 건강 개선을 원하는 소비자 수요 증가로 기준 처방 개선 필요',
            desiredForm: '츄어블 정제',
            function: '신물 억제 보조',
            goal: '기준 처방을 바탕으로 맛, 색, 붕해 안정성을 개선한다.',
            name: '신물 억제 고형제 개발',
            objective: '비타민 C 산미와 아연 관능을 개선한 츄어블 정제 처방 확정',
            sourceFormulaId: 'seed-formula-kolmar-solid-baseline-v1',
            sourceProductId: 'seed-product-kolmar-solid-baseline',
            target: '위 건강',
        },
    });
    await prisma.formulaTry.upsert({
        where: { id: 'seed-try-001' },
        update: {
            dosageForm: '츄어블 정제',
            manufacturingProcess: '혼합 - 타정 - PTP 포장',
            memo: '초기 기준 처방. 비타민 C 500mg 기준으로 관능과 붕해 안정성 확인.',
            projectId: 'seed-project-reflux-tablet',
            starred: true,
            status: 'PLANNED',
            title: '기준 처방',
            tryNumber: 1,
        },
        create: {
            id: 'seed-try-001',
            dosageForm: '츄어블 정제',
            manufacturingProcess: '혼합 - 타정 - PTP 포장',
            memo: '초기 기준 처방. 비타민 C 500mg 기준으로 관능과 붕해 안정성 확인.',
            projectId: 'seed-project-reflux-tablet',
            starred: true,
            status: 'PLANNED',
            title: '기준 처방',
            tryNumber: 1,
        },
    });
    for (const fi of formulaIngredients) {
        await prisma.tryIngredient.upsert({
            where: { id: `seed-try-ingredient-${fi.ingredientId}` },
            update: {
                amount: fi.amount,
                ingredientId: fi.ingredientId,
                note: fi.role,
                ratio: fi.ratio,
                tryId: 'seed-try-001',
                unit: fi.unit,
            },
            create: {
                id: `seed-try-ingredient-${fi.ingredientId}`,
                amount: fi.amount,
                ingredientId: fi.ingredientId,
                note: fi.role,
                ratio: fi.ratio,
                tryId: 'seed-try-001',
                unit: fi.unit,
            },
        });
    }
    await prisma.formulaTry.upsert({
        where: { id: 'seed-try-002' },
        update: {
            dosageForm: '츄어블 정제',
            manufacturingProcess: '혼합 - 마그네슘 코팅 - 타정 - PTP 포장',
            memo: '마그네슘 추가 후 맛 변화 관찰. 신경 안정 효과 시너지 확인 목적.',
            projectId: 'seed-project-reflux-tablet',
            starred: false,
            status: 'IN_PROGRESS',
            title: '마그네슘 강화 처방',
            tryNumber: 2,
        },
        create: {
            id: 'seed-try-002',
            dosageForm: '츄어블 정제',
            manufacturingProcess: '혼합 - 마그네슘 코팅 - 타정 - PTP 포장',
            memo: '마그네슘 추가 후 맛 변화 관찰. 신경 안정 효과 시너지 확인 목적.',
            projectId: 'seed-project-reflux-tablet',
            starred: false,
            status: 'IN_PROGRESS',
            title: '마그네슘 강화 처방',
            tryNumber: 2,
        },
    });
    const try2Ingredients = [
        ...formulaIngredients,
        {
            id: 'seed-formula-ingredient-magnesium',
            ingredientId: 'seed-ingredient-magnesium',
            amount: '100',
            unit: 'mg',
            ratio: '8',
            role: '신경 안정 시너지 추가',
        },
    ];
    for (const fi of try2Ingredients) {
        await prisma.tryIngredient.upsert({
            where: { id: `seed-try2-ingredient-${fi.ingredientId}` },
            update: {
                amount: fi.amount,
                ingredientId: fi.ingredientId,
                note: fi.role,
                ratio: fi.ratio,
                tryId: 'seed-try-002',
                unit: fi.unit,
            },
            create: {
                id: `seed-try2-ingredient-${fi.ingredientId}`,
                amount: fi.amount,
                ingredientId: fi.ingredientId,
                note: fi.role,
                ratio: fi.ratio,
                tryId: 'seed-try-002',
                unit: fi.unit,
            },
        });
    }
    await prisma.developmentProject.upsert({
        where: { id: 'seed-project-fatigue-jelly' },
        update: {
            background: '홍삼 제품 관능 불만 피드백 접수 후 개선 프로젝트 시작',
            desiredForm: '젤리',
            function: '피로 개선 및 스트레스 완화',
            goal: '홍삼 쓴맛을 낮추고 스틱 젤리 안정성을 검토한다.',
            name: '활력 젤리 관능 개선',
            objective: '홍삼 쓴맛 마스킹 처방 확정 및 스틱 포장 안정성 확보',
            sourceFormulaId: 'seed-formula-fatigue-jelly-v1',
            sourceProductId: 'seed-product-fatigue-jelly',
            target: '직장인',
        },
        create: {
            id: 'seed-project-fatigue-jelly',
            background: '홍삼 제품 관능 불만 피드백 접수 후 개선 프로젝트 시작',
            desiredForm: '젤리',
            function: '피로 개선 및 스트레스 완화',
            goal: '홍삼 쓴맛을 낮추고 스틱 젤리 안정성을 검토한다.',
            name: '활력 젤리 관능 개선',
            objective: '홍삼 쓴맛 마스킹 처방 확정 및 스틱 포장 안정성 확보',
            sourceFormulaId: 'seed-formula-fatigue-jelly-v1',
            sourceProductId: 'seed-product-fatigue-jelly',
            target: '직장인',
        },
    });
    await prisma.formulaTry.upsert({
        where: { id: 'seed-try-fatigue-001' },
        update: {
            dosageForm: '젤리',
            manufacturingProcess: '원료 용해 - 겔화 - 스틱 충전',
            memo: '홍삼 기준 처방 관능 확인. 쓴맛 강도 측정 기준 데이터 수집.',
            projectId: 'seed-project-fatigue-jelly',
            starred: true,
            status: 'PLANNED',
            title: '홍삼 기준 젤리',
            tryNumber: 1,
        },
        create: {
            id: 'seed-try-fatigue-001',
            dosageForm: '젤리',
            manufacturingProcess: '원료 용해 - 겔화 - 스틱 충전',
            memo: '홍삼 기준 처방 관능 확인. 쓴맛 강도 측정 기준 데이터 수집.',
            projectId: 'seed-project-fatigue-jelly',
            starred: true,
            status: 'PLANNED',
            title: '홍삼 기준 젤리',
            tryNumber: 1,
        },
    });
    await prisma.formulaTry.upsert({
        where: { id: 'seed-try-fatigue-002' },
        update: {
            dosageForm: '젤리',
            manufacturingProcess: '원료 용해 - 산미 조절 - 겔화 - 스틱 충전',
            memo: '비타민 C 산미를 줄이고 감미 밸런스 확인. 천연 감미료 비율 변경.',
            projectId: 'seed-project-fatigue-jelly',
            starred: false,
            status: 'DRAFT',
            title: '산미 조정 젤리',
            tryNumber: 2,
        },
        create: {
            id: 'seed-try-fatigue-002',
            dosageForm: '젤리',
            manufacturingProcess: '원료 용해 - 산미 조절 - 겔화 - 스틱 충전',
            memo: '비타민 C 산미를 줄이고 감미 밸런스 확인. 천연 감미료 비율 변경.',
            projectId: 'seed-project-fatigue-jelly',
            starred: false,
            status: 'DRAFT',
            title: '산미 조정 젤리',
            tryNumber: 2,
        },
    });
    await prisma.developmentProject.upsert({
        where: { id: 'seed-project-eye-softgel' },
        update: {
            background: '루테인 아이케어 출시 후 산패 이슈 클레임 접수로 안정성 재검토',
            desiredForm: '연질캡슐',
            function: '눈 건강',
            goal: '루테인 산패 안정성과 캡슐 충전 공정을 검토한다.',
            name: '루테인 연질캡슐 안정성 검토',
            objective: '오일 베이스 산패 방지 처방 확정 및 캡슐 피막 안정성 확보',
            sourceFormulaId: 'seed-formula-eye-softgel-v1',
            sourceProductId: 'seed-product-eye-softgel',
            target: '디지털 작업자',
        },
        create: {
            id: 'seed-project-eye-softgel',
            background: '루테인 아이케어 출시 후 산패 이슈 클레임 접수로 안정성 재검토',
            desiredForm: '연질캡슐',
            function: '눈 건강',
            goal: '루테인 산패 안정성과 캡슐 충전 공정을 검토한다.',
            name: '루테인 연질캡슐 안정성 검토',
            objective: '오일 베이스 산패 방지 처방 확정 및 캡슐 피막 안정성 확보',
            sourceFormulaId: 'seed-formula-eye-softgel-v1',
            sourceProductId: 'seed-product-eye-softgel',
            target: '디지털 작업자',
        },
    });
    await prisma.formulaTry.upsert({
        where: { id: 'seed-try-eye-001' },
        update: {
            dosageForm: '연질캡슐',
            manufacturingProcess: '오일 혼합 - 캡슐 충전 - 블리스터 포장',
            memo: '루테인 기준 처방 산패 안정성 확인. 기존 처방 동일 조건 재현.',
            projectId: 'seed-project-eye-softgel',
            starred: false,
            status: 'PLANNED',
            title: '루테인 기준 캡슐',
            tryNumber: 1,
        },
        create: {
            id: 'seed-try-eye-001',
            dosageForm: '연질캡슐',
            manufacturingProcess: '오일 혼합 - 캡슐 충전 - 블리스터 포장',
            memo: '루테인 기준 처방 산패 안정성 확인. 기존 처방 동일 조건 재현.',
            projectId: 'seed-project-eye-softgel',
            starred: false,
            status: 'PLANNED',
            title: '루테인 기준 캡슐',
            tryNumber: 1,
        },
    });
    await prisma.evidenceSource.upsert({
        where: { id: 'seed-evidence-source-mfds' },
        update: {
            baseUrl: 'https://www.foodsafetykorea.go.kr',
            name: '식품안전나라/식약처 공개 정보',
            type: 'official',
        },
        create: {
            id: 'seed-evidence-source-mfds',
            baseUrl: 'https://www.foodsafetykorea.go.kr',
            name: '식품안전나라/식약처 공개 정보',
            type: 'official',
        },
    });
    await prisma.evidenceItem.upsert({
        where: { id: 'seed-evidence-item-vitamin-c' },
        update: {
            grade: 'official',
            rawText: '공개 기준 규격 데이터는 원문 출처를 함께 저장하고 내부 근거로 재사용한다.',
            sourceId: 'seed-evidence-source-mfds',
            sourceUrl: 'https://www.foodsafetykorea.go.kr',
            summary: '비타민 C 고형제 처방에서 산미, 함량, 기준 규격 확인이 필요한 seed 근거입니다.',
            title: '비타민 C 고형제 기준 규격 참고',
        },
        create: {
            id: 'seed-evidence-item-vitamin-c',
            grade: 'official',
            rawText: '공개 기준 규격 데이터는 원문 출처를 함께 저장하고 내부 근거로 재사용한다.',
            sourceId: 'seed-evidence-source-mfds',
            sourceUrl: 'https://www.foodsafetykorea.go.kr',
            summary: '비타민 C 고형제 처방에서 산미, 함량, 기준 규격 확인이 필요한 seed 근거입니다.',
            title: '비타민 C 고형제 기준 규격 참고',
        },
    });
    await prisma.evidenceLink.upsert({
        where: { id: 'seed-evidence-link-vitamin-c-product' },
        update: {
            evidenceId: 'seed-evidence-item-vitamin-c',
            relation: 'formulation_guidance',
            targetId: 'seed-formula-kolmar-solid-baseline-v1',
            targetType: 'ProductFormula',
        },
        create: {
            id: 'seed-evidence-link-vitamin-c-product',
            evidenceId: 'seed-evidence-item-vitamin-c',
            relation: 'formulation_guidance',
            targetId: 'seed-formula-kolmar-solid-baseline-v1',
            targetType: 'ProductFormula',
        },
    });
    await prisma.dataImportJob.upsert({
        where: { id: 'seed-import-job-mfds' },
        update: {
            finishedAt: new Date('2026-01-01T00:00:00.000Z'),
            message: 'seed로 등록된 공개 정보 예시',
            sourceName: 'MFDS OpenAPI',
            status: 'IMPORTED',
        },
        create: {
            id: 'seed-import-job-mfds',
            finishedAt: new Date('2026-01-01T00:00:00.000Z'),
            message: 'seed로 등록된 공개 정보 예시',
            sourceName: 'MFDS OpenAPI',
            status: 'IMPORTED',
        },
    });
    await prisma.rawExternalRecord.upsert({
        where: { id: 'seed-raw-record-mfds-vitamin-c' },
        update: {
            externalId: 'seed-mfds-vitamin-c',
            importJobId: 'seed-import-job-mfds',
            message: '정규화 완료 seed record',
            normalizedEvidenceId: 'seed-evidence-item-vitamin-c',
            normalizedStatus: 'NORMALIZED',
            rawPayload: {
                ingredient: '비타민 C',
                source: 'MFDS OpenAPI',
                usage: '고형제 기준 규격 참고',
            },
            sourceName: 'MFDS OpenAPI',
            sourceUrl: 'https://www.foodsafetykorea.go.kr',
        },
        create: {
            id: 'seed-raw-record-mfds-vitamin-c',
            externalId: 'seed-mfds-vitamin-c',
            importJobId: 'seed-import-job-mfds',
            message: '정규화 완료 seed record',
            normalizedEvidenceId: 'seed-evidence-item-vitamin-c',
            normalizedStatus: 'NORMALIZED',
            rawPayload: {
                ingredient: '비타민 C',
                source: 'MFDS OpenAPI',
                usage: '고형제 기준 규격 참고',
            },
            sourceName: 'MFDS OpenAPI',
            sourceUrl: 'https://www.foodsafetykorea.go.kr',
        },
    });
    await prisma.auditLog.upsert({
        where: { id: 'seed-audit-initial-data' },
        update: {
            action: 'SEED_INITIAL_DATA',
            metadata: {
                projectId: 'seed-project-reflux-tablet',
                productId: 'seed-product-kolmar-solid-baseline',
            },
            summary: '초기 개발 확인용 풍부한 seed 데이터 등록',
            targetId: 'seed-project-reflux-tablet',
            targetType: 'System',
        },
        create: {
            id: 'seed-audit-initial-data',
            action: 'SEED_INITIAL_DATA',
            metadata: {
                projectId: 'seed-project-reflux-tablet',
                productId: 'seed-product-kolmar-solid-baseline',
            },
            summary: '초기 개발 확인용 풍부한 seed 데이터 등록',
            targetId: 'seed-project-reflux-tablet',
            targetType: 'System',
        },
    });
    await prisma.vectorDocument.upsert({
        where: { id: 'seed-vector-vitamin-c-guidance' },
        update: {
            content: '비타민 C 고형제 처방은 산미, 기준 규격, 배합 안정성을 함께 검토해야 한다.',
            entityId: 'seed-evidence-item-vitamin-c',
            entityType: 'EvidenceItem',
            metadata: {
                dosageForm: '츄어블 정제',
                ingredientId: 'seed-ingredient-vitamin-c',
                source: 'seed',
            },
        },
        create: {
            id: 'seed-vector-vitamin-c-guidance',
            content: '비타민 C 고형제 처방은 산미, 기준 규격, 배합 안정성을 함께 검토해야 한다.',
            entityId: 'seed-evidence-item-vitamin-c',
            entityType: 'EvidenceItem',
            metadata: {
                dosageForm: '츄어블 정제',
                ingredientId: 'seed-ingredient-vitamin-c',
                source: 'seed',
            },
        },
    });
    return {
        dosageForms: dosageForms.length,
        evidenceItems: 1,
        ingredients: ingredients.length,
        products: 4,
        projects: 3,
        tries: 5,
        vectorDocuments: 1,
    };
}
async function seedDatabase(prisma) {
    return prisma.$transaction((tx) => upsertSeedData(tx));
}
//# sourceMappingURL=seed-data.js.map