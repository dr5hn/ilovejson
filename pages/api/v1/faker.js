import { createV1Handler } from '@lib/v1Handler';
import { faker } from '@faker-js/faker';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

function generateField(config) {
  const { type, subtype, min, max, options } = config;
  switch (type) {
    case 'name':
      if (subtype === 'firstName') return faker.person.firstName();
      if (subtype === 'lastName') return faker.person.lastName();
      return faker.person.fullName();
    case 'email': return faker.internet.email();
    case 'phone': return faker.phone.number();
    case 'address':
      if (subtype === 'street') return faker.location.streetAddress();
      if (subtype === 'city') return faker.location.city();
      if (subtype === 'state') return faker.location.state();
      if (subtype === 'country') return faker.location.country();
      if (subtype === 'zipCode') return faker.location.zipCode();
      return { street: faker.location.streetAddress(), city: faker.location.city(), state: faker.location.state(), zipCode: faker.location.zipCode(), country: faker.location.country() };
    case 'date':
      if (subtype === 'past') return faker.date.past();
      if (subtype === 'future') return faker.date.future();
      if (subtype === 'recent') return faker.date.recent();
      if (subtype === 'birthdate') return faker.date.birthdate();
      return faker.date.anytime();
    case 'number':
      if (subtype === 'float') return faker.number.float({ min: min || 0, max: max || 100, fractionDigits: 2 });
      return faker.number.int({ min: min || 0, max: max || 100 });
    case 'boolean': return faker.datatype.boolean();
    case 'uuid': return faker.string.uuid();
    case 'lorem':
      if (subtype === 'word') return faker.lorem.word();
      if (subtype === 'words') return faker.lorem.words(max || 3);
      if (subtype === 'sentence') return faker.lorem.sentence();
      if (subtype === 'paragraph') return faker.lorem.paragraph();
      return faker.lorem.sentence();
    case 'image':
      return subtype === 'avatar' ? faker.image.avatar() : faker.image.url();
    case 'company':
      return subtype === 'catchPhrase' ? faker.company.catchPhrase() : faker.company.name();
    case 'internet':
      if (subtype === 'username') return faker.internet.username();
      if (subtype === 'url') return faker.internet.url();
      if (subtype === 'domainName') return faker.internet.domainName();
      if (subtype === 'ipAddress') return faker.internet.ip();
      return faker.internet.url();
    case 'enum':
      return options?.length ? faker.helpers.arrayElement(options) : null;
    default: return null;
  }
}

export default createV1Handler(async (req, res) => {
  const { schema, count = 10, seed } = req.body || {};
  if (!schema || typeof schema !== 'object') {
    return res.status(400).json({ error: 'missing_field', field: 'schema', message: 'schema must be an object' });
  }
  if (count < 1 || count > 10000) {
    return res.status(400).json({ error: 'invalid_count', message: 'count must be between 1 and 10,000' });
  }
  if (seed) faker.seed(parseInt(seed));
  const data = Array.from({ length: count }, () => {
    const record = {};
    for (const [key, cfg] of Object.entries(schema)) record[key] = generateField(cfg);
    return record;
  });
  return res.status(200).json({ count, preview: data.slice(0, 3), data });
});
