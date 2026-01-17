import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { faker } from '@faker-js/faker';
import { ReS, ReE } from '@utils/reusables';
import { runMiddleware } from '@middleware/apiMiddleware';
import { validateMethod } from '@middleware/methodValidation';
import { rateLimit } from '@middleware/rateLimit';
import { errorHandler } from '@middleware/errorHandler';

const fs = require('fs');
initDirs();

const downloadDir = globals.downloadDir + '/jsonfaker';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

function generateField(config) {
  const { type, subtype, min, max, options } = config;

  switch (type) {
    case 'name':
      switch (subtype) {
        case 'firstName': return faker.person.firstName();
        case 'lastName': return faker.person.lastName();
        case 'fullName':
        default: return faker.person.fullName();
      }

    case 'email':
      return faker.internet.email();

    case 'phone':
      return faker.phone.number();

    case 'address':
      switch (subtype) {
        case 'street': return faker.location.streetAddress();
        case 'city': return faker.location.city();
        case 'state': return faker.location.state();
        case 'country': return faker.location.country();
        case 'zipCode': return faker.location.zipCode();
        case 'full':
        default:
          return {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
          };
      }

    case 'date':
      switch (subtype) {
        case 'past': return faker.date.past();
        case 'future': return faker.date.future();
        case 'recent': return faker.date.recent();
        case 'birthdate': return faker.date.birthdate();
        default: return faker.date.anytime();
      }

    case 'number':
      if (subtype === 'float') {
        return faker.number.float({ min: min || 0, max: max || 100, fractionDigits: 2 });
      }
      return faker.number.int({ min: min || 0, max: max || 100 });

    case 'boolean':
      return faker.datatype.boolean();

    case 'uuid':
      return faker.string.uuid();

    case 'lorem':
      switch (subtype) {
        case 'word': return faker.lorem.word();
        case 'words': return faker.lorem.words(max || 3);
        case 'sentence': return faker.lorem.sentence();
        case 'paragraph': return faker.lorem.paragraph();
        default: return faker.lorem.sentence();
      }

    case 'image':
      switch (subtype) {
        case 'avatar': return faker.image.avatar();
        case 'url':
        default: return faker.image.url();
      }

    case 'company':
      switch (subtype) {
        case 'name': return faker.company.name();
        case 'catchPhrase': return faker.company.catchPhrase();
        default: return faker.company.name();
      }

    case 'internet':
      switch (subtype) {
        case 'username': return faker.internet.username();
        case 'url': return faker.internet.url();
        case 'domainName': return faker.internet.domainName();
        case 'ipAddress': return faker.internet.ip();
        default: return faker.internet.url();
      }

    case 'array':
      const arrayLength = faker.number.int({ min: min || 1, max: max || 5 });
      return Array.from({ length: arrayLength }, () => faker.lorem.word());

    case 'enum':
      if (options && options.length > 0) {
        return faker.helpers.arrayElement(options);
      }
      return null;

    default:
      return null;
  }
}

function generateFromSchema(schema, count) {
  return Array.from({ length: count }, () => {
    const record = {};
    for (const [key, config] of Object.entries(schema)) {
      record[key] = generateField(config);
    }
    return record;
  });
}

async function handler(req, res) {
  // Run middleware
  await runMiddleware(req, res, [
    validateMethod(['POST']),
    rateLimit({ maxRequests: 10, windowMs: 60000 }),
  ]);

  const { schema, count = 10, seed } = req.body;

  if (!schema || typeof schema !== 'object') {
    return ReE(res, 'Valid schema object is required', 400);
  }

  if (count < 1 || count > 10000) {
    return ReE(res, 'Count must be between 1 and 10,000', 400);
  }

  try {
    // Set seed for reproducible data
    if (seed) {
      faker.seed(parseInt(seed));
    }

    // Generate data
    const data = generateFromSchema(schema, count);

    // Save to file
    const modifiedDate = new Date().getTime();
    const outputFilePath = `${downloadDir}/${modifiedDate}.json`;
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2), 'utf8');

    const toPath = outputFilePath.replace('public/', '');

    return ReS(res, {
      message: `Successfully generated ${count} records.`,
      data: `/${toPath}`,
      count,
      preview: data.slice(0, 3), // Return first 3 records as preview
    });
  } catch (error) {
    throw error;
  }
}

export default errorHandler(handler);
