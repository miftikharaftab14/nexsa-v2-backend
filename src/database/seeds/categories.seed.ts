import { DataSource } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

export class CategoriesSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const categoryRepository = this.dataSource.getRepository(Category);

    // Categories extracted from your image
    const categories = [
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
    ].map(name => ({
      name,
      systemGenerated: true,
    }));

    for (const categoryData of categories) {
      const existingCategory = await categoryRepository.findOne({
        where: { name: categoryData.name },
      });

      if (!existingCategory) {
        const category = categoryRepository.create(categoryData);
        await categoryRepository.save(category);
        console.log(`✅ Created category: ${categoryData.name}`);
      } else {
        console.log(`ℹ️  Category already exists: ${categoryData.name}`);
      }
    }

    console.log('🎉 Categories seeding completed!');
  }
}
