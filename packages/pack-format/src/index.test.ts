import { describe, expect, it } from 'vitest';
import {
	boardOrder,
	checkTargets,
	codeGaps,
	codeParts,
	filledCode,
	filledLine,
	layerFor,
	lineParts,
	localizeUnit,
	validateChecks,
	validateCoverage,
	validatePack,
	validateVerified,
	verifyJobs,
	verifySeen,
	type ContentCheck,
	type Coverage,
	type Layer,
	type Layers,
	type PackManifest,
	type Task,
	type Unit,
	type VerifyRecord
} from './index.js';

const sources = [{ title: 'A source', url: 'https://example.org/' }];

const pack = (): PackManifest => ({
	id: 'test',
	category: 'certification',
	licence: 'CC-BY-SA-4.0',
	formatVersion: 1,
	version: '1.0.0',
	holdsFor: [{ name: 'Tool', version: '2.0' }],
	checkedOn: '2026-10-31',
	explanations: ['en'],
	keywords: ['test', 'tool'],
	sections: ['main'],
	lessons: [
		{ id: 'l1', section: 'main', units: ['table', 'code', 'lines'], tasks: ['t1'], study: [] }
	],
	verify: { guard: { run: 'tool context', expect: '^sandbox$' } }
});

const table = (): Unit => ({
	id: 'table',
	sources,
	layout: { type: 'table', rows: ['r1', 'r2'], columns: ['c1', 'c2'], gaps: ['r2/c1'] },
	verify: {
		columns: { c1: { run: 'tool list', expect: '^{row} {text}$' } },
		run: 'tool get {text}'
	},
	cells: [
		{ id: 'a', item: 'i:a', text: 'v1', row: 'r1', col: 'c1' },
		{ id: 'b', item: 'i:b', text: 'v1', row: 'r1', col: 'c2' },
		{ id: 'c', item: 'i:c', text: 'apps/v1', row: 'r2', col: 'c2' }
	]
});

const code = (): Unit => ({
	id: 'code',
	sources,
	dealAll: true,
	layout: { type: 'code', code: ['kind: Thing', 'spec:', '  {{gap:x}}: 1', '  {{gap:y}}: {}'] },
	verify: { run: 'tool apply -f -', stdin: '{code}' },
	cells: [
		{ id: 'x', item: 'i:x', text: 'replicas' },
		{ id: 'y', item: 'i:y', text: 'emptyDir' }
	]
});

const lines = (): Unit => ({
	id: 'lines',
	sources,
	layout: { type: 'lines', size: 2 },
	verify: { run: '{line} --dry-run' },
	cells: [
		{ id: 'p', item: 'i:p', text: '--from', line: 'tool create job a ___=cron/b' },
		{
			id: 'q',
			item: 'i:q',
			text: '-l',
			line: 'tool get pods ___ app=web',
			verify: { run: '{line}' }
		}
	]
});

const tasks = (): Task[] => [
	{
		id: 't1',
		item: 'task:t1',
		minutes: 6,
		where: 'cluster',
		source: { title: 'Task one', url: 'https://example.org/t1' }
	}
];

const layer = (): Layer => ({
	course: {
		title: 'Test',
		summary: 'A pack.',
		sections: { main: { title: 'Main' } },
		lessons: { l1: { title: 'Lesson one' } },
		concepts: {}
	},
	units: {
		table: {
			title: 'A table',
			summary: 'Sum',
			headers: { r1: 'One', r2: 'Two', c1: 'A', c2: 'B' }
		},
		code: { title: 'Code', summary: 'Sum', cells: { x: { note: 'How many.' } } },
		lines: {
			title: 'Lines',
			summary: 'Sum',
			cells: { p: { clue: 'A job now from a cron job' }, q: { clue: 'Only the web Pods' } }
		}
	},
	tasks: { t1: { title: 'Do it', brief: 'Do the thing by hand.' } }
});

const all = () => ({ pack: pack(), units: [table(), code(), lines()], tasks: tasks() });
const layers = (): Layers => ({ en: layer() });
const issuesOf = (
	p = pack(),
	units = [table(), code(), lines()],
	t = tasks(),
	l: Layers = layers()
) => validatePack(p, units, t, l).map((issue) => issue.problem);

describe('validatePack', () => {
	it('accepts a complete pack', () => {
		expect(issuesOf()).toEqual([]);
	});

	it('requires the versions the content holds for, and when they were checked', () => {
		expect(issuesOf({ ...pack(), holdsFor: [] })).toContain('manifest says nothing it holds for');
		expect(issuesOf({ ...pack(), checkedOn: 'today' })).toContain(
			'checkedOn "today" is not YYYY-MM-DD'
		);
	});

	it('requires keywords that include the pack id', () => {
		expect(issuesOf({ ...pack(), keywords: ['tool'] })).toContain(
			'keywords must include the pack id'
		);
	});

	it('rejects an unknown category', () => {
		expect(issuesOf({ ...pack(), category: 'hobby' as never })).toContain('unknown category hobby');
	});

	it('finds a table crossing with no cell, and a gap that has one', () => {
		const holed = { ...table(), cells: table().cells.slice(1) };
		expect(issuesOf(pack(), [holed, code(), lines()])).toContain('r1/c1 has 0 cells, expected 1');
		const filled = { ...table(), layout: { ...table().layout, gaps: ['r1/c1'] } } as Unit;
		expect(issuesOf(pack(), [filled, code(), lines()])).toContain('r1/c1 has 1 cells, expected 0');
	});

	it('requires every code gap to name a cell, once, and every cell to have a gap', () => {
		const extra = code();
		extra.layout = { type: 'code', code: ['{{gap:x}}', '{{gap:x}}', '{{gap:z}}'] };
		const problems = issuesOf(pack(), [table(), extra, lines()]);
		expect(problems).toContain('gap x appears more than once');
		expect(problems).toContain('gap z has no cell');
		expect(problems).toContain('cell y has no gap in the code');
	});

	it('requires one gap per line, and a line that does not give its answer away', () => {
		const bad = lines();
		bad.cells[0].line = 'tool create job a --from=cron/b ___';
		bad.cells[1].line = 'tool get pods app=web';
		const problems = issuesOf(pack(), [table(), code(), bad]);
		expect(problems).toContain('line "tool create job a --from=cron/b ___" gives away the answer');
		expect(problems).toContain('cell q needs a line with one gap');
	});

	it.each(['(--from)', 'x: --from.', '[--from]', 'cron/--from'])(
		'finds an answer glued to punctuation in %s (#8)',
		(around) => {
			const bad = lines();
			bad.cells[0].line = `tool create job a ${around} ___=cron/b`;
			expect(issuesOf(pack(), [table(), code(), bad])).toContain(
				`line "${bad.cells[0].line}" gives away the answer`
			);
		}
	);

	it('does not take a longer word for the answer', () => {
		const ok = lines();
		ok.cells[0].line = 'tool create job a ___=cron/b --from-file=x';
		expect(issuesOf(pack(), [table(), code(), ok])).toEqual([]);
	});

	it('requires a clue on every line, which must not contain the answer', () => {
		const l = layers();
		l.en.units.lines.cells = { p: { clue: 'Use --from here' } };
		const problems = issuesOf(pack(), undefined, undefined, l);
		expect(problems).toContain('clue "Use --from here" gives away the answer');
		expect(problems).toContain('cell q has no clue');
	});

	it('rejects an answer with layout space around it', () => {
		const t = table();
		t.cells[0].text = ' v1';
		expect(issuesOf(pack(), [t, code(), lines()])).toContain(
			'text " v1" has surrounding or inner layout space'
		);
	});

	it('requires the same item to have the same answer everywhere', () => {
		const t = table();
		t.cells[2].item = 'i:x';
		expect(issuesOf(pack(), [t, code(), lines()])).toContain(
			'item i:x is "replicas" here and "apps/v1" elsewhere'
		);
	});

	it('checks tasks: listed, in one lesson, timed, placed, sourced and described', () => {
		const p = pack();
		p.lessons[0].tasks = ['t1', 'missing'];
		const odd: Task = { ...tasks()[0], minutes: 0, where: 'moon' as never };
		const problems = issuesOf(p, undefined, [odd]);
		expect(problems).toContain('task missing is listed but missing');
		expect(problems).toContain('minutes 0 is not a whole number above 0');
		expect(problems).toContain('unknown place moon');

		const l = layers();
		l.en.tasks = {};
		expect(issuesOf(pack(), undefined, undefined, l)).toContain('needs a title and a brief');
	});

	it('finds a task in no lesson', () => {
		const extra: Task = { ...tasks()[0], id: 't2', item: 'task:t2' };
		expect(issuesOf(pack(), undefined, [...tasks(), extra])).toContain(
			'task t2 is not in any lesson'
		);
	});

	it('requires a guard before anything is verified, and a way to verify each cell', () => {
		const p = pack();
		delete p.verify;
		expect(issuesOf(p)).toContain('the pack has no verify guard');

		const t = table();
		t.verify = { columns: { c1: { run: 'tool list' } } };
		expect(issuesOf(pack(), [t, code(), lines()])).toContain('cell b has no way to be verified');
	});

	it('reports a code board whose verify has nothing to run (#10)', () => {
		const c = code();
		c.verify = { expect: 'configured' };
		expect(issuesOf(pack(), [table(), c, lines()])).toContain('verify step has nothing to run');
	});

	it('lets a code board opt out of verify by having none', () => {
		const c = code();
		delete c.verify;
		expect(issuesOf(pack(), [table(), c, lines()])).toEqual([]);
	});

	it('requires the base layer to name the pack, its lessons and its headers', () => {
		const l = layers();
		l.en.course.title = '';
		l.en.course.lessons = {};
		l.en.units.table.headers = { r1: 'One' };
		const problems = issuesOf(pack(), undefined, undefined, l);
		expect(problems).toContain('the pack has no title');
		expect(problems).toContain('lesson l1 has no title');
		expect(problems).toContain('header c1 has no label');
	});
});

describe('code boards', () => {
	it('splits a line into text and gaps', () => {
		expect(codeParts('  {{gap:x}}: 1')).toEqual([{ text: '  ' }, { gap: 'x' }, { text: ': 1' }]);
		expect(codeParts('')).toEqual([{ text: '' }]);
		expect(codeGaps(['{{gap:a}} {{gap:b}}', 'c', '{{gap:c}}'])).toEqual(['a', 'b', 'c']);
	});

	it('fills every gap with its answer', () => {
		expect(filledCode(code())).toBe('kind: Thing\nspec:\n  replicas: 1\n  emptyDir: {}');
	});

	it('localizes into lines of parts', () => {
		const local = localizeUnit(code(), layer().units.code, {});
		expect(local.layout).toEqual({
			type: 'code',
			code: [
				[{ text: 'kind: Thing' }],
				[{ text: 'spec:' }],
				[{ text: '  ' }, { gap: 'x' }, { text: ': 1' }],
				[{ text: '  ' }, { gap: 'y' }, { text: ': {}' }]
			]
		});
		expect(local.cells[0].note).toBe('How many.');
	});
});

describe('boardOrder', () => {
	it('reads a table by rows and a code board by its gaps', () => {
		const shuffled = { ...table(), cells: [...table().cells].reverse() };
		expect(boardOrder(localizeUnit(shuffled, undefined, {})).map((c) => c.id)).toEqual([
			'a',
			'b',
			'c'
		]);
		const swapped = { ...code(), cells: [...code().cells].reverse() };
		expect(boardOrder(localizeUnit(swapped, undefined, {})).map((c) => c.id)).toEqual(['x', 'y']);
	});
});

describe('lines', () => {
	it('splits a line at its gap and fills it', () => {
		expect(lineParts('a ___=b')).toEqual(['a ', '=b']);
		expect(filledLine({ line: 'a ___=b', text: '--x' })).toBe('a --x=b');
	});
});

describe('layerFor', () => {
	it('reads the learner’s language if offered, else the first', () => {
		expect(layerFor({ explanations: ['en', 'it'] }, 'it')).toBe('it');
		expect(layerFor({ explanations: ['en', 'it'] }, 'pl')).toBe('en');
	});
});

describe('validateCoverage', () => {
	const coverage = (): Coverage => ({
		id: 'exam',
		title: 'An exam',
		version: 'v2.0',
		source: sources[0],
		domains: [
			{
				id: 'd1',
				title: 'One',
				weight: 60,
				competencies: [{ id: 'c1', title: 'Do', units: ['table'], tasks: ['t1'] }]
			},
			{ id: 'd2', title: 'Two', weight: 40, competencies: [] }
		]
	});
	const { units, tasks: t } = all();

	it('accepts a complete mapping', () => {
		expect(validateCoverage(coverage(), units, t)).toEqual([]);
	});

	it('needs weights that add up to 100, and names that exist', () => {
		const c = coverage();
		c.domains[1].weight = 30;
		c.domains[0].competencies[0].units = ['nope'];
		const problems = validateCoverage(c, units, t).map((issue) => issue.problem);
		expect(problems).toContain('domain weights add up to 90, not 100');
		expect(problems).toContain('d1/c1 names unknown unit nope');
	});

	it('takes published ranges, which must be able to make 100', () => {
		const c = coverage();
		c.domains[0].weight = [55, 65];
		c.domains[1].weight = [35, 40];
		expect(validateCoverage(c, units, t)).toEqual([]);
		c.domains[1].weight = [50, 60];
		expect(validateCoverage(c, units, t).map((issue) => issue.problem)).toContain(
			"domain weights span 105 to 125, which can't make 100"
		);
		c.domains[1].weight = [40, 30];
		expect(validateCoverage(c, units, t).map((issue) => issue.problem)).toContain(
			'domain d2 has an impossible weight'
		);
	});

	it('finds a task mapped to nothing', () => {
		const c = coverage();
		c.domains[0].competencies[0].tasks = [];
		expect(validateCoverage(c, units, t).map((issue) => issue.problem)).toContain(
			'task t1 is mapped to no competency'
		);
	});
});

describe('checks', () => {
	const { pack: p, units, tasks: t } = all();
	const targets = () => checkTargets(p, units, t, layers());
	const passed = (checker: string): ContentCheck => ({
		checker,
		entries: targets().map(({ key, seen }) => ({ key, seen, verdict: 'ok' }))
	});

	it('covers versions, code, cells, tasks and every layer text', () => {
		const keys = targets().map((target) => target.key);
		expect(keys).toEqual(
			expect.arrayContaining([
				'core/holdsFor',
				'core/lesson/l1',
				'core/code',
				'core/code/x',
				'core/table/a',
				'core/task/t1',
				'en/pack',
				'en/task/t1',
				'en/lines/p'
			])
		);
	});

	it('needs two different checkers', () => {
		expect(validateChecks(targets(), [passed('one')])).not.toEqual([]);
		expect(validateChecks(targets(), [passed('one'), passed('two')])).toEqual([]);
	});

	it('voids a check when the code around a gap changes', () => {
		const checks = [passed('one'), passed('two')];
		const edited = code();
		(edited.layout as { code: string[] }).code[0] = 'kind: Other';
		const after = checkTargets(p, [table(), edited, lines()], t, layers());
		expect(validateChecks(after, checks).map((issue) => issue.where)).toEqual(['core/code']);
	});

	it('voids a check when a unit’s sources change (#9)', () => {
		const checks = [passed('one'), passed('two')];
		const moved = table();
		moved.sources = [{ title: 'A source', url: 'https://example.org/moved' }];
		const after = checkTargets(p, [moved, code(), lines()], t, layers());
		expect(validateChecks(after, checks).map((issue) => issue.where)).toEqual([
			'core/table/sources'
		]);
	});

	it('voids a check when a version claim changes', () => {
		const checks = [passed('one'), passed('two')];
		const after = checkTargets(
			{ ...p, holdsFor: [{ name: 'Tool', version: '3.0' }] },
			units,
			t,
			layers()
		);
		expect(validateChecks(after, checks).map((issue) => issue.where)).toEqual(['core/holdsFor']);
	});
});

describe('verification', () => {
	const jobs = () => verifyJobs([table(), code(), lines()]);

	it('fills each job from the cell, the column, the unit or the code', () => {
		const byKey = new Map(jobs().map((job) => [job.key, job]));
		expect(byKey.get('verify/table/a')).toEqual({
			key: 'verify/table/a',
			run: 'tool list',
			stdin: undefined,
			expect: '^r1 v1$'
		});
		expect(byKey.get('verify/table/b')?.run).toBe('tool get v1');
		expect(byKey.get('verify/code')?.stdin).toBe(filledCode(code()));
		expect(byKey.get('verify/lines/p')?.run).toBe('tool create job a --from=cron/b --dry-run');
		expect(byKey.get('verify/lines/q')?.run).toBe('tool get pods -l app=web');
	});

	it('matches an answer literally in an expectation', () => {
		const t = table();
		t.cells[0].text = 'a.b';
		const job = verifyJobs([t]).find((candidate) => candidate.key === 'verify/table/a')!;
		expect(job.expect).toBe('^r1 a\\.b$');
	});

	it('accepts a record of every job passing as it now stands, and nothing less', () => {
		const record: VerifyRecord = {
			ranAgainst: 'sandbox',
			ranOn: '2026-10-31',
			entries: jobs().map((job) => ({ key: job.key, seen: verifySeen(job), ok: true }))
		};
		expect(validateVerified(jobs(), record)).toEqual([]);
		expect(validateVerified(jobs(), undefined)).not.toEqual([]);

		const failed = { ...record, entries: record.entries.map((e) => ({ ...e, ok: false })) };
		expect(validateVerified(jobs(), failed)[0].problem).toBe('failed verification');

		const edited = lines();
		edited.cells[0].text = '--to';
		const after = verifyJobs([table(), code(), edited]);
		expect(validateVerified(after, record)).toEqual([
			{ where: 'verify/lines/p', problem: 'not verified as it now stands' }
		]);
	});
});
