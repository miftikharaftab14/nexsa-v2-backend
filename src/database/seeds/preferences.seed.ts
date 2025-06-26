import { DataSource } from 'typeorm';
import { Preference } from '../../common/entities/preference.entity';

export class PreferencesSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const preferenceRepository = this.dataSource.getRepository(Preference);

    // Preferences extracted from categories
    const preferences = [
      'Shoes',
      'Handbags',
      'Accessories',
      'Apparel/Rtw',
      'Jewelry',
      'Designer Sale',
      'Sale',
      'Chanel',
      'Hermes',
      'Louis Vuitton',
      'Bottega Veneta',
      'Versace',
      'Brioni',
      'Gucci',
      'Christian Dior',
      'Cartier',
      'Saint Laurent',
      'Givenchy',
      'Loewe',
      'Celine',
      'Fendi',
      'Christian Louboutin',
      'Rolex',
      'Patek Philippe',
      'Miu Miu',
      'Prada',
      'The Row',
      'Valentino',
      'Ferragamo',
      'Armani',
      'Ralph Lauren',
      'Burberry',
      'Dolce & Gabbana',
      'Tiffany & Co.',
      'Jimmy Choo',
      'Balenciaga',
      'Brunello Cucinelli',
      'Van Cleef & Arpels',
      'Manolo Blahnik',
      'Tom Ford',
      'Other',
    ];

    for (const preferenceName of preferences) {
      const existingPreference = await preferenceRepository.findOne({
        where: { name: preferenceName },
      });

      if (!existingPreference) {
        const preference = preferenceRepository.create({
          name: preferenceName,
        });
        await preferenceRepository.save(preference);
        console.log(`✅ Created preference: ${preferenceName}`);
      } else {
        console.log(`ℹ️  Preference already exists: ${preferenceName}`);
      }
    }

    console.log('🎉 Preferences seeding completed!');
  }
}
