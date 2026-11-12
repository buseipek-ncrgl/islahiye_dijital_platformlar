using Gastronomy.Domain;
using Gastronomy.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Gastronomy.Infrastructure.Data;

public static class GastronomyDataSeeder
{
    public static async Task SeedAsync(GastronomyDbContext db, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Dishes.AnyAsync(ct))
        {
            logger.LogInformation("Gastronomi veritabanında mevcut kayıtlar var; seeding atlandı.");
            return;
        }

        logger.LogInformation("Gastronomi veritabanı tohumlama (seeding) başlatılıyor...");

        // 1. DISHES & RECIPES
        var dishes = GetSeedDishes();
        await db.Dishes.AddRangeAsync(dishes, ct);

        // 2. VERIFIED PLACES (Mod B - Gerçek koordinatlı fiziksel duraklar)
        var places = GetSeedPlaces();
        await db.Places.AddRangeAsync(places, ct);

        // 3. CULTURAL STORIES
        var stories = GetSeedStories();
        await db.Stories.AddRangeAsync(stories, ct);

        // 4. CONCEPT CLIPS / FILMS
        var films = GetSeedFilms();
        await db.Films.AddRangeAsync(films, ct);

        // 5. NEWS / EVENTS
        var news = GetSeedNewsEvents();
        await db.NewsEvents.AddRangeAsync(news, ct);

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Gastronomi veritabanı tohumlama başarıyla tamamlandı: {Dishes} yemek, {Places} mekan, {Stories} hikâye, {Films} klip.",
            dishes.Count, places.Count, stories.Count, films.Count);
    }

    private static List<Dish> GetSeedDishes()
    {
        // 1. İslahiye Tavası
        var tava = new Dish
        {
            Id = "dish-islahiye-tava",
            Slug = "islahiye-tava",
            Name = "Geleneksel İslahiye Tavası",
            AlternativeNames = "İslahiye Fırın Tavası, Bakır Tava",
            Category = DishCategory.TavaEt,
            CategoryLabel = "Tava & Et Yemekleri",
            Tagline = "Taş fırının meşe közünde demlenen kuzu eti, sarımsak ve İslahiye biberi.",
            ShortDescription = "Amanos yaylalarının kuzu eti, bol yerli sarımsak, tarla domatesi ve İslahiye kırmızı biberiyle bakır tepside harmanlanan, taş fırında ağır ağır pişen asırlık çarşı ve ocaklık lezzeti.",
            Description = "Amanos yaylalarında otlayan kuzuların eti, zırhtan geçirilerek yerli sarımsak, taze tarla domatesi ve İslahiye'nin meşhur kırmızı biberiyle buluşur. Geleneksel bakır tepsilere yayılan harç, sabahın erken saatlerinde yakılan meşe odunlu taş fırının tatlı sıcağında 55 dakika kendi suyu ve buharıyla pişirilir.",
            CulturalNote = "İslahiye fırınlarında sabahın erken saatlerinde meşe odunu ateşiyle pişirilir; tırnaklı pideyle fırından çıktığı anda sıcak servis edilir.",
            OriginNote = "İslahiye Taş Fırın Geleneği",
            IsRegisteredGeographicalIndication = false,
            GiStatusNote = "Yöresel Mutfak Mirası",
            SeasonalAvailability = "Dört Mevsim (Sonbahar Biberiyle En İdeal)",
            PrepTimeMinutes = 25,
            CookTimeMinutes = 55,
            Difficulty = "orta",
            DefaultServings = 4,
            ImageUrl = "/images/islahiye_tava.jpg",
            ImageAlt = "Geleneksel taş fırında pişen bakır tepside İslahiye Tavası",
            ImageCredit = "İslahiye Lezzet Atlası Görsel Arşivi",
            IsLead = true,
            OrderIndex = 1
        };

        var tavaRecipe = new Recipe
        {
            Id = "recipe-islahiye-tava",
            DishId = tava.Id,
            Dish = tava,
            Title = "Taş Fırın Usulü İslahiye Tavası",
            Slug = "tas-firin-usulu-islahiye-tavasi",
            Yield = 4,
            YieldUnit = "porsiyon",
            AuthorType = "yerel_usta",
            AuthorName = "İslahiye Çarşı Taş Fırın Ustaları",
            AuthorAffiliation = "İslahiye Fırıncılar İmecesi",
            PrepTimeMinutes = 25,
            CookTimeMinutes = 55,
            RestTimeMinutes = 5,
            Difficulty = "orta",
            IsPrimary = true,
            Notes = "Kuzu etini çok küçük doğramamak suyunu ve lezzetini muhafaza eder. Yanında tırnaklı pide ile servis edilmesi gelenektir."
        };

        tavaRecipe.Ingredients.AddRange([
            new RecipeIngredient { RecipeId = tavaRecipe.Id, Name = "Kuzu kuşbaşı (orta yağlı)", Amount = 800, Unit = "g", Category = "Et & Yağ", Notes = "Zırhtan geçirilmiş veya küçük kuşbaşı doğranmış", IsKeyIngredient = true, OrderIndex = 1 },
            new RecipeIngredient { RecipeId = tavaRecipe.Id, Name = "İslahiye kırmızı pul biberi", Amount = 2, Unit = "tatlı kaşığı", Category = "Baharat", Notes = "İpeksi pul kıvamında tescilli biber", IsKeyIngredient = true, OrderIndex = 2 },
            new RecipeIngredient { RecipeId = tavaRecipe.Id, Name = "Yerli diş sarımsak", Amount = 12, Unit = "diş", Category = "Sebze", Notes = "Ayıklanmış, bütün bırakılmış", IsKeyIngredient = true, OrderIndex = 3 },
            new RecipeIngredient { RecipeId = tavaRecipe.Id, Name = "Köy domatesi", Amount = 4, Unit = "adet", Category = "Sebze", Notes = "İri dilimlenmiş", OrderIndex = 4 },
            new RecipeIngredient { RecipeId = tavaRecipe.Id, Name = "Köy biberi (yeşil)", Amount = 3, Unit = "adet", Category = "Sebze", Notes = "İri doğranmış", OrderIndex = 5 },
            new RecipeIngredient { RecipeId = tavaRecipe.Id, Name = "Kuyruk yağı (ince kıyılmış)", Amount = 70, Unit = "g", Category = "Et & Yağ", Notes = "Tepsinin tabanına ve aralara serpiştirilir", OrderIndex = 6 },
            new RecipeIngredient { RecipeId = tavaRecipe.Id, Name = "Doğal kaya tuzu & karabiber", Amount = 1, Unit = "tatlı kaşığı", Category = "Baharat", IsOptional = false, OrderIndex = 7 }
        ]);

        tavaRecipe.Steps.AddRange([
            new RecipeStep { RecipeId = tavaRecipe.Id, StepNumber = 1, Title = "Eti Hazırlama & Tepsiye Yayma", Instruction = "Kuzu eti oda sıcaklığında dinlendirilir; ince kıyılmış kuyruk yağı ile geniş bir bakır tavaya yayılır.", Tip = "Eti çok küçük doğramamak suyunu ve lezzetini muhafaza eder.", DurationMinutes = 10 },
            new RecipeStep { RecipeId = tavaRecipe.Id, StepNumber = 2, Title = "Sebzeleri Dizme", Instruction = "Ayıklanmış diş sarımsaklar ezilmeden bütün olarak etlerin arasına yerleştirilir; domates ve biberler iri dilimler halinde üzerine dizilir.", DurationMinutes = 10 },
            new RecipeStep { RecipeId = tavaRecipe.Id, StepNumber = 3, Title = "Baharatlama ve Taş Fırında Pişirme", Instruction = "İslahiye pul biberi ve kaya tuzu serpildikten sonra taş fırında (veya 200°C önceden ısıtılmış ev fırınında) yaklaşık 50-55 dakika suyunu çekene kadar demlendirilir.", Tip = "Fırından çıkar çıkmaz taze sıcak pideyle servis edilmesi önerilir.", DurationMinutes = 55 }
        ]);
        tava.Recipes.Add(tavaRecipe);

        // 2. Firik Pilavı
        var firik = new Dish
        {
            Id = "dish-firik-pilavi",
            Slug = "firik-pilavi",
            Name = "Amanos Usulü Firik Pilavı",
            AlternativeNames = "İsli Firik Pilavı, Etli Firik",
            Category = DishCategory.TavaEt,
            CategoryLabel = "Geleneksel Pilavlar",
            Tagline = "Başaktayken közde tütsülenen yeşil buğdayın isli aroması ve tereyağı.",
            ShortDescription = "Amanos eteklerinde süt olum döneminde hasat edilip alevde közlenen yeşil buğdayın (firik), köy tereyağı ve nohut ile taş fırında ağır pişen kuzu etiyle buluşması.",
            Description = "Firik, buğday başaklarının olgunlaşma öncesi yeşilken toplanıp meşe dalları ateşinde tütsülenmesiyle elde edilir. Bu kadim yöntem buğdaya benzersiz bir is kokusu kazandırır. Pilavlık bulgur, haşlanmış nohut, kuzu kemik suyu ve yayla tereyağıyla demlenerek bakır sahanda sunulur.",
            CulturalNote = "Firik, Mezopotamya’dan günümüze taşınan kadim bir tahıl mirasıdır. Eşsiz isli rayihası yakma işleminden gelir.",
            OriginNote = "İslahiye & Barak Mutfak Mirası",
            IsRegisteredGeographicalIndication = false,
            GiStatusNote = "Yöresel Mutfak Mirası",
            SeasonalAvailability = "Yaz Başlangıcı (Firik Hasat Dönemi) & Dört Mevsim",
            PrepTimeMinutes = 15,
            CookTimeMinutes = 30,
            Difficulty = "kolay",
            DefaultServings = 4,
            ImageUrl = "/images/firik_pilavi.jpg",
            ImageAlt = "Bakır sahanda etli geleneksel firik pilavı sunumu",
            ImageCredit = "İslahiye Lezzet Atlası Görsel Arşivi",
            IsLead = true,
            OrderIndex = 2
        };

        var firikRecipe = new Recipe
        {
            Id = "recipe-firik-pilavi",
            DishId = firik.Id,
            Dish = firik,
            Title = "Köz Aromalı Geleneksel Firik Pilavı",
            Slug = "koz-aromali-firik-pilavi",
            Yield = 4,
            YieldUnit = "porsiyon",
            AuthorType = "yerel_usta",
            AuthorName = "Amanos Yayla Mutfağı",
            PrepTimeMinutes = 15,
            CookTimeMinutes = 30,
            RestTimeMinutes = 20,
            Difficulty = "kolay",
            IsPrimary = true
        };

        firikRecipe.Ingredients.AddRange([
            new RecipeIngredient { RecipeId = firikRecipe.Id, Name = "Közlenmiş firik bulguru", Amount = 1.5m, Unit = "su bardağı", Category = "Tahıl", Notes = "İs aromalı temiz firik", IsKeyIngredient = true, OrderIndex = 1 },
            new RecipeIngredient { RecipeId = firikRecipe.Id, Name = "Pilavlık bulgur", Amount = 0.5m, Unit = "su bardağı", Category = "Tahıl", OrderIndex = 2 },
            new RecipeIngredient { RecipeId = firikRecipe.Id, Name = "Köy tereyağı", Amount = 3, Unit = "yemek kaşığı", Category = "Yağ", IsKeyIngredient = true, OrderIndex = 3 },
            new RecipeIngredient { RecipeId = firikRecipe.Id, Name = "Haşlanmış nohut", Amount = 1, Unit = "su bardağı", Category = "Bakliyat", OrderIndex = 4 },
            new RecipeIngredient { RecipeId = firikRecipe.Id, Name = "Kuzu et suyu", Amount = 4, Unit = "su bardağı", Category = "Sıvı", OrderIndex = 5 },
            new RecipeIngredient { RecipeId = firikRecipe.Id, Name = "Kaya tuzu & taze karabiber", Amount = 1, Unit = "tatlı kaşığı", Category = "Baharat", OrderIndex = 6 }
        ]);

        firikRecipe.Steps.AddRange([
            new RecipeStep { RecipeId = firikRecipe.Id, StepNumber = 1, Title = "Firiği Ayıklama", Instruction = "Firik bulguru ayıklanır; is aromasını kaybetmemesi için yalnızca hafifçe sudan geçirilir, suda bekletilmez.", DurationMinutes = 5 },
            new RecipeStep { RecipeId = firikRecipe.Id, StepNumber = 2, Title = "Kavurma & Sıvı İlavesi", Instruction = "Köy tereyağında bulgur hafifçe kavrulur, sıcak kuzu et suyu ve haşlanmış nohutlar ilave edilir.", DurationMinutes = 5 },
            new RecipeStep { RecipeId = firikRecipe.Id, StepNumber = 3, Title = "Demleme", Instruction = "Kısık ateşte suyunu çekene dek pişirilir; ocaktan alındıktan sonra keten örtüyle 20 dakika demlendirilir.", Tip = "Yanında süzme yayık ayranı ve taze nane ile sunulması tavsiye edilir.", DurationMinutes = 20 }
        ]);
        firik.Recipes.Add(firikRecipe);

        // 3. İslahiye Biberi (TÜRKPATENT Tescil No 991 - Resmî Tescilli!)
        var biber = new Dish
        {
            Id = "dish-islahiye-biberi",
            Slug = "islahiye-biberi",
            Name = "İslahiye Biberi",
            AlternativeNames = "İslahiye Kırmızı Biberi, İpek Pul Biber",
            Category = DishCategory.OzelLezzet,
            CategoryLabel = "Yöresel Tescilli Ürünler",
            Tagline = "Ovanın güneşiyle kuruyan, taş dibeklerde işlenen tescilli kırmızı lezzet.",
            ShortDescription = "İslahiye Ovası’nın bereketli kırmızı toprağında yetişen biberler sonbaharda toplanır; güneşte doğal olarak kurutulup zeytinyağıyla ovularak taş dibeklerde ipeksi pul kıvamına getirilir.",
            Description = "05.01.2022 tarihinde TÜRKPATENT nezdinde 991 tescil numarası ile Mahreç İşareti alan İslahiye Biberi; alüvyon ova toprağı, Amanos yamaçlarından esen serin rüzgârlar ve bol güneş ışığı sayesinde yüksek aromatik yağ oranı ve meyvemsi tat profiline sahiptir. Aşırı yakıcı acılık yerine ipeksi ve derin bir lezzet taşır.",
            CulturalNote = "İslahiye mutfağının ruhunu veren bu ürün, yakıcı acılıktan ziyade meyvemsi aroması ve parlak yakut rengiyle TÜRKPATENT nezdinde coğrafi işaret tescili almıştır.",
            OriginNote = "TÜRKPATENT Tescil No: 991 (Mahreç İşareti)",
            IsRegisteredGeographicalIndication = true,
            GiRegistrationNumber = "991",
            GiStatusNote = "TÜRKPATENT Coğrafi İşaret Tescil No: 991",
            SeasonalAvailability = "Eylül - Ekim Hasadı, Yıl Boyunca Kuru & Pul",
            PrepTimeMinutes = 60,
            CookTimeMinutes = 0,
            Difficulty = "ileri",
            DefaultServings = 10,
            ImageUrl = "/images/islahiye_biberi.jpg",
            ImageAlt = "Geleneksel toprak kapta İslahiye ipek pul biberi ve kurutulmuş biberler",
            ImageCredit = "İslahiye Lezzet Atlası Görsel Arşivi",
            IsLead = true,
            OrderIndex = 3
        };

        var biberRecipe = new Recipe
        {
            Id = "recipe-islahiye-biberi",
            DishId = biber.Id,
            Dish = biber,
            Title = "Geleneksel Taş Dibek Usulü İpek Pul Biber Yapımı",
            Slug = "tas-dibek-usulu-ipek-pul-biber",
            Yield = 10,
            YieldUnit = "kavanoz",
            AuthorType = "yerel_usta",
            AuthorName = "İslahiye Biber Üreticileri",
            AuthorAffiliation = "TÜRKPATENT Tescil No: 991 Şartnamesi",
            PrepTimeMinutes = 60,
            CookTimeMinutes = 0,
            RestTimeMinutes = 1440,
            Difficulty = "ileri",
            IsPrimary = true
        };

        biberRecipe.Ingredients.AddRange([
            new RecipeIngredient { RecipeId = biberRecipe.Id, Name = "Kurutulmuş İslahiye kırmızı biberi", Amount = 1000, Unit = "g", Category = "Hammadde", Notes = "Güneşte kurutulmuş, tohumu ayıklanmış", IsKeyIngredient = true, OrderIndex = 1 },
            new RecipeIngredient { RecipeId = biberRecipe.Id, Name = "Sızma zeytinyağı (yağlama için)", Amount = 2, Unit = "yemek kaşığı", Category = "Yağ", Notes = "Parlaklık ve koruma için", OrderIndex = 2 },
            new RecipeIngredient { RecipeId = biberRecipe.Id, Name = "Doğal kaya tuzu", Amount = 1, Unit = "tatlı kaşığı", Category = "Baharat", OrderIndex = 3 }
        ]);

        biberRecipe.Steps.AddRange([
            new RecipeStep { RecipeId = biberRecipe.Id, StepNumber = 1, Title = "Ayıklama & Güneşleme", Instruction = "Tam olgunlaşmış kırmızı biberler tohum ve saplarından elle ayıklanarak temiz hasırlarda kurutulur.", DurationMinutes = 30 },
            new RecipeStep { RecipeId = biberRecipe.Id, StepNumber = 2, Title = "Taş Dibek Dövümü", Instruction = "Taş dibeklerde ezilerek lifli ipeksi pul kıvamına kavuşturulur.", DurationMinutes = 30 },
            new RecipeStep { RecipeId = biberRecipe.Id, StepNumber = 3, Title = "Zeytinyağı ile Ovma ve Muhafaza", Instruction = "Az miktarda sızma zeytinyağı ve kaya tuzu ile ovularak serin ve karanlık yerde cam kaplarda saklanır.", DurationMinutes = 15 }
        ]);
        biber.Recipes.Add(biberRecipe);

        // 4. Semsek Böreği
        var semsek = new Dish
        {
            Id = "dish-semsek-boregi",
            Slug = "semsek-boregi",
            Name = "Geleneksel İslahiye Semseği",
            AlternativeNames = "Sac Semseği, Çökelekli Semsek",
            Category = DishCategory.HamurIsi,
            CategoryLabel = "Hamur İşleri",
            Tagline = "El açması incecik yufka, taze çökelek ve nane kokulu saç böreği.",
            ShortDescription = "Mayasız hamurun oklavayla açılıp taze köy çökeleği, maydanoz, kuru nane ve İslahiye pul biberiyle doldurularak sac üzerinde altın sarısı beneklerle pişirildiği geleneksel börek.",
            Description = "Amanos dağ köylerinde yaylacılık döneminde kadınların imece usulü sac başında açtığı taze çökelekli semsek, sacdan alınır alınmaz üzerine sürülen mis kokulu köy tereyağı ile eşsiz bir lezzete kavuşur.",
            CulturalNote = "İmece usulü sac başında pişirilip sıcağıyla tereyağı sürülerek ikram edilen kadim bir dayanışma ve yayla lezzetidir.",
            OriginNote = "Amanos Köy Mutfak Geleneği",
            IsRegisteredGeographicalIndication = false,
            GiStatusNote = "Yöresel Mutfak Mirası",
            PrepTimeMinutes = 35,
            CookTimeMinutes = 15,
            Difficulty = "orta",
            DefaultServings = 6,
            ImageUrl = "/images/semsek_boregi.jpg",
            ImageAlt = "Ahşap tahtada taze pişmiş tereyağlı geleneksel semsek böreği",
            ImageCredit = "İslahiye Lezzet Atlası Görsel Arşivi",
            IsLead = false,
            OrderIndex = 4
        };

        var semsekRecipe = new Recipe
        {
            Id = "recipe-semsek-boregi",
            DishId = semsek.Id,
            Dish = semsek,
            Title = "Sac Üstünde Köy Usulü Semsek Böreği",
            Slug = "sac-ustunde-koy-usulu-semsek",
            Yield = 6,
            YieldUnit = "porsiyon",
            AuthorType = "ev_ascisi",
            AuthorName = "Amanos Köy Kadınları İmecesi",
            PrepTimeMinutes = 35,
            CookTimeMinutes = 15,
            Difficulty = "orta",
            IsPrimary = true
        };

        semsekRecipe.Ingredients.AddRange([
            new RecipeIngredient { RecipeId = semsekRecipe.Id, Name = "Elenmiş buğday unu", Amount = 4, Unit = "su bardağı", Category = "Hamur", OrderIndex = 1 },
            new RecipeIngredient { RecipeId = semsekRecipe.Id, Name = "Su ve kaya tuzu", Amount = 1.5m, Unit = "su bardağı", Category = "Hamur", OrderIndex = 2 },
            new RecipeIngredient { RecipeId = semsekRecipe.Id, Name = "Taze köy çökeleği / lor", Amount = 350, Unit = "g", Category = "İç Harç", IsKeyIngredient = true, OrderIndex = 3 },
            new RecipeIngredient { RecipeId = semsekRecipe.Id, Name = "Kuru nane ve taze maydanoz", Amount = 1, Unit = "demet", Category = "İç Harç", OrderIndex = 4 },
            new RecipeIngredient { RecipeId = semsekRecipe.Id, Name = "İslahiye pul biberi", Amount = 1.5m, Unit = "tatlı kaşığı", Category = "İç Harç", IsKeyIngredient = true, OrderIndex = 5 },
            new RecipeIngredient { RecipeId = semsekRecipe.Id, Name = "Üzerine sürmek için köy tereyağı", Amount = 50, Unit = "g", Category = "Yağ", OrderIndex = 6 }
        ]);

        semsekRecipe.Steps.AddRange([
            new RecipeStep { RecipeId = semsekRecipe.Id, StepNumber = 1, Title = "Hamur Yoğurma & Bezeleme", Instruction = "Un, tuz ve suyla yumuşak kıvamlı bir hamur yoğrulur; bezelere ayrılıp dinlendirilir.", DurationMinutes = 15 },
            new RecipeStep { RecipeId = semsekRecipe.Id, StepNumber = 2, Title = "Açma ve Harçlama", Instruction = "Açılan yufkanın yarısına peynirli iç harç konulur, yarım ay biçiminde kapatılıp kenarları ruletle kesilir.", DurationMinutes = 10 },
            new RecipeStep { RecipeId = semsekRecipe.Id, StepNumber = 3, Title = "Sacda Pişirme", Instruction = "Kızgın sacda veya döküm tavada iki yüzü hafifçe kabarıp beneklenene dek pişirilir; sıcakken tereyağı gezdirilir.", DurationMinutes = 10 }
        ]);
        semsek.Recipes.Add(semsekRecipe);

        // 5. Bayram Kömbesi
        var kombe = new Dish
        {
            Id = "dish-islahiye-kombesi",
            Slug = "islahiye-kombesi",
            Name = "Taş Fırın Bayram Kömbesi",
            AlternativeNames = "İslahiye Kömbesi, Baharatlı Çörek",
            Category = DishCategory.HamurIsi,
            CategoryLabel = "Geleneksel Çörekler",
            Tagline = "Ahşap oyma kalıplarla şekil alan, 7 çeşit baharatlı asırlık çörek.",
            ShortDescription = "Mahlep, tarçın, muskat, zencefil ve damla sakızının sadeyağ ile harmanlandığı; ahşap oyma kalıplarla desen verilip susamla taş fırında kurutularak pişirilen dayanıklı fırın lezzeti.",
            Description = "Bayram günlerinin en kıymetli hediyesidir; ahşap kalıpların üzerindeki geometrik motifler nesilden nesile aktarılan ailevi bir imzadır.",
            CulturalNote = "Bayram günlerinin en kıymetli hediyesidir; ahşap kalıpların üzerindeki geometrik motifler nesilden nesile aktarılan ailevi bir imzadır.",
            OriginNote = "İslahiye Fırın Geleneği",
            IsRegisteredGeographicalIndication = false,
            GiStatusNote = "Yöresel Mutfak Mirası",
            PrepTimeMinutes = 45,
            CookTimeMinutes = 25,
            Difficulty = "ileri",
            DefaultServings = 12,
            ImageUrl = "/images/islahiye_kombesi.jpg",
            ImageAlt = "Seramik tabakta ahşap kalıp desenli geleneksel kömbe çörekleri",
            ImageCredit = "İslahiye Lezzet Atlası Görsel Arşivi",
            IsLead = false,
            OrderIndex = 5
        };

        var kombeRecipe = new Recipe
        {
            Id = "recipe-islahiye-kombesi",
            DishId = kombe.Id,
            Dish = kombe,
            Title = "7 Baharatlı Taş Fırın Kömbesi",
            Slug = "7-baharatli-tas-firin-kombesi",
            Yield = 12,
            YieldUnit = "adet",
            AuthorType = "yerel_usta",
            AuthorName = "İslahiye Taş Fırın Ustaları",
            PrepTimeMinutes = 45,
            CookTimeMinutes = 25,
            Difficulty = "ileri",
            IsPrimary = true
        };

        kombeRecipe.Ingredients.AddRange([
            new RecipeIngredient { RecipeId = kombeRecipe.Id, Name = "Köy buğday unu", Amount = 5, Unit = "su bardağı", Category = "Un", OrderIndex = 1 },
            new RecipeIngredient { RecipeId = kombeRecipe.Id, Name = "Eritilmiş sadeyağ", Amount = 1.5m, Unit = "su bardağı", Category = "Yağ", IsKeyIngredient = true, OrderIndex = 2 },
            new RecipeIngredient { RecipeId = kombeRecipe.Id, Name = "Süt", Amount = 1, Unit = "su bardağı", Category = "Sıvı", OrderIndex = 3 },
            new RecipeIngredient { RecipeId = kombeRecipe.Id, Name = "Toz şeker", Amount = 1, Unit = "su bardağı", Category = "Tatlandırıcı", OrderIndex = 4 },
            new RecipeIngredient { RecipeId = kombeRecipe.Id, Name = "Özel kömbe baharat karışımı (mahlep, tarçın, zencefil vb.)", Amount = 2, Unit = "yemek kaşığı", Category = "Baharat", IsKeyIngredient = true, OrderIndex = 5 },
            new RecipeIngredient { RecipeId = kombeRecipe.Id, Name = "Kavrulmuş susam", Amount = 1, Unit = "su bardağı", Category = "Süsleme", OrderIndex = 6 }
        ]);

        kombeRecipe.Steps.AddRange([
            new RecipeStep { RecipeId = kombeRecipe.Id, StepNumber = 1, Title = "Yağ ve Baharat Harmanı", Instruction = "Sadeyağ eritilir; un ve kömbe baharatları kum kıvamına gelene kadar elle ovalanarak yedirilir.", DurationMinutes = 15 },
            new RecipeStep { RecipeId = kombeRecipe.Id, StepNumber = 2, Title = "Bezeleme ve Susamlama", Instruction = "Şeker ve sütle toparlanan hamurdan ceviz iriliğinde parçalar koparılıp kavrulmuş susama batırılır.", DurationMinutes = 15 },
            new RecipeStep { RecipeId = kombeRecipe.Id, StepNumber = 3, Title = "Kalıplama & Fırınlama", Instruction = "Geleneksel ahşap kalıba basılarak desen verilir; taş fırında hafif ateşte kurutularak pişirilir.", DurationMinutes = 25 }
        ]);
        kombe.Recipes.Add(kombeRecipe);

        // 6. Dağ İnciri Tatlısı
        var incir = new Dish
        {
            Id = "dish-incir-tatlisi",
            Slug = "incir-tatlisi",
            Name = "Cevizli Dağ İnciri Tatlısı",
            AlternativeNames = "Sütlü İncir Dolması, Amanos İncir Tatlısı",
            Category = DishCategory.Tatli,
            CategoryLabel = "Geleneksel Tatlılar",
            Tagline = "Amanos yamaçlarının kuru inciri, dövme ceviz ve süt buharında demlenmiş lezzet.",
            ShortDescription = "Amanos yamaçlarında güneşte kurutulan sarı dağ incirlerinin içi dövülmüş yerli cevizle doldurulup az miktarda süt ve tereyağı buharında kısık ateşte karamelize edilen hafif geleneksel tatlı.",
            Description = "Rafine şeker kullanılmadan, incirin kendi meyve özüyle demlenen kış ocaklığı tatlısıdır.",
            CulturalNote = "Rafine şeker kullanılmadan, incirin kendi meyve özüyle demlenen kış ocaklığı tatlısıdır.",
            OriginNote = "Amanos Dağ Köyleri Tatlı Kültürü",
            IsRegisteredGeographicalIndication = false,
            GiStatusNote = "Yöresel Mutfak Mirası",
            PrepTimeMinutes = 20,
            CookTimeMinutes = 30,
            Difficulty = "kolay",
            DefaultServings = 6,
            ImageUrl = "/images/incir_tatlisi.jpg",
            ImageAlt = "Geleneksel porselen tabakta cevizli kuru incir tatlısı",
            ImageCredit = "İslahiye Lezzet Atlası Görsel Arşivi",
            IsLead = false,
            OrderIndex = 6
        };

        var incirRecipe = new Recipe
        {
            Id = "recipe-incir-tatlisi",
            DishId = incir.Id,
            Dish = incir,
            Title = "Süt Buharında Cevizli Kuru İncir Tatlısı",
            Slug = "sut-buharinda-cevizli-incir-tatlisi",
            Yield = 6,
            YieldUnit = "porsiyon",
            AuthorType = "ev_ascisi",
            AuthorName = "Amanos Dağ Köyleri Mutfağı",
            PrepTimeMinutes = 20,
            CookTimeMinutes = 30,
            Difficulty = "kolay",
            IsPrimary = true
        };

        incirRecipe.Ingredients.AddRange([
            new RecipeIngredient { RecipeId = incirRecipe.Id, Name = "Kurutulmuş dağ inciri", Amount = 18, Unit = "adet", Category = "Meyve", IsKeyIngredient = true, OrderIndex = 1 },
            new RecipeIngredient { RecipeId = incirRecipe.Id, Name = "Dövülmüş ceviz içi", Amount = 1.5m, Unit = "su bardağı", Category = "Kuruyemiş", IsKeyIngredient = true, OrderIndex = 2 },
            new RecipeIngredient { RecipeId = incirRecipe.Id, Name = "Köy sütü", Amount = 1.5m, Unit = "su bardağı", Category = "Sıvı", OrderIndex = 3 },
            new RecipeIngredient { RecipeId = incirRecipe.Id, Name = "Köy tereyağı", Amount = 1, Unit = "yemek kaşığı", Category = "Yağ", OrderIndex = 4 },
            new RecipeIngredient { RecipeId = incirRecipe.Id, Name = "Çubuk tarçın", Amount = 1, Unit = "adet", Category = "Baharat", IsOptional = true, OrderIndex = 5 }
        ]);

        incirRecipe.Steps.AddRange([
            new RecipeStep { RecipeId = incirRecipe.Id, StepNumber = 1, Title = "İncirleri Yumuşatma & Doldurma", Instruction = "Kuru incirler ılık suda yumuşatılır, üst kısımları açılarak ceviz içiyle sıkıca doldurulur.", DurationMinutes = 15 },
            new RecipeStep { RecipeId = incirRecipe.Id, StepNumber = 2, Title = "Tencereye Dizme & Süt İlavesi", Instruction = "Tencereye dizilen incirlerin üzerine süt ve tereyağı gezdirilir, çubuk tarçın ilave edilir.", DurationMinutes = 5 },
            new RecipeStep { RecipeId = incirRecipe.Id, StepNumber = 3, Title = "Kısık Ateşte Demleme", Instruction = "Kapağı kapalı olarak kısık ateşte sütü çekene dek yaklaşık 25 dakika demlendirilir; ılık servis edilir.", DurationMinutes = 25 }
        ]);
        incir.Recipes.Add(incirRecipe);

        return [tava, firik, biber, semsek, kombe, incir];
    }

    private static List<GastronomyPlace> GetSeedPlaces()
    {
        return
        [
            new GastronomyPlace
            {
                Id = "place-tarihi-carsi-tava-firini",
                Slug = "tarihi-carsi-tava-firini",
                Name = "Tarihi Çarşı Taş Fırını",
                Category = PlaceCategory.FirinBorekci,
                CategoryLabel = "Taş Fırın & Tava Ocağı",
                Description = "İslahiye çarşısında asırlık meşe odunu közünde döküm tepsilerde hazırlanan geleneksel İslahiye Tavası’nın pişirildiği çarşı fırını.",
                ShortAddress = "Cumhuriyet Mah., Hakkı Demirel Cad. No: 14, İslahiye",
                FullAddress = "Cumhuriyet Mahallesi, Hakkı Demirel Caddesi No: 14, 27800 İslahiye / Gaziantep",
                District = "İslahiye",
                Neighborhood = "Cumhuriyet Mahallesi",
                OpeningHours = "08:00 – 21:00 (Haftanın her günü)",
                Latitude = 37.0262,
                Longitude = 36.6325,
                HasVerifiedCoordinates = true,
                VerificationStatus = PlaceVerificationStatus.Verified,
                VerificationSource = "İslahiye Gastronomi Envanteri 2026 Saha Taraması",
                CoverImageUrl = "/images/islahiye_tava.jpg",
                SignatureDishIds = "dish-islahiye-tava,dish-islahiye-kombesi",
                IsRecommended = true,
                OrderIndex = 1
            },
            new GastronomyPlace
            {
                Id = "place-amanos-firik-mutfagi",
                Slug = "amanos-firik-mutfagi",
                Name = "Amanos Firik Sofrası & Lezzet Ocağı",
                Category = PlaceCategory.TarihiLokanta,
                CategoryLabel = "Yöresel Yemek Lokantası",
                Description = "Amanos yamaçlarında meşe dumanıyla tütsülenen yeşil buğday ve yayla etiyle pişirilen geleneksel Firik Pilavı durağı.",
                ShortAddress = "Fevzi Çakmak Mah., İstasyon Cad. No: 28, İslahiye",
                FullAddress = "Fevzi Çakmak Mahallesi, İstasyon Caddesi No: 28, 27800 İslahiye / Gaziantep",
                District = "İslahiye",
                Neighborhood = "Fevzi Çakmak Mahallesi",
                OpeningHours = "11:00 – 22:00",
                Latitude = 37.0289,
                Longitude = 36.6274,
                HasVerifiedCoordinates = true,
                VerificationStatus = PlaceVerificationStatus.Verified,
                VerificationSource = "İslahiye Gastronomi Envanteri 2026 Saha Taraması",
                CoverImageUrl = "/images/firik_pilavi.jpg",
                SignatureDishIds = "dish-firik-pilavi",
                IsRecommended = true,
                OrderIndex = 2
            },
            new GastronomyPlace
            {
                Id = "place-islahiye-biber-hasat-havzasi",
                Slug = "islahiye-biber-hasat-havzasi",
                Name = "Tescilli İslahiye Biber Sergi & İşleme Havzası",
                Category = PlaceCategory.UreticiCiftlik,
                CategoryLabel = "Tarımsal Miras & Üretici Havzası",
                Description = "TÜRKPATENT tescilli (No: 991) İslahiye Biberi’nin alüvyon toprakta yetişip güneşte kurutulduğu ve ipek pul bibere dönüştürüldüğü ana ova alanı.",
                ShortAddress = "Beyler Mah., Biber İşleme Yolu No: 4, İslahiye Ovası",
                FullAddress = "Beyler Mahallesi, Biber İşleme Yolu No: 4, 27800 İslahiye Ovası / Gaziantep",
                District = "İslahiye",
                Neighborhood = "Beyler Mahallesi",
                OpeningHours = "09:00 – 18:00 (Hasat Dönemi: Eylül - Kasım)",
                Latitude = 37.0195,
                Longitude = 36.6450,
                HasVerifiedCoordinates = true,
                VerificationStatus = PlaceVerificationStatus.Verified,
                VerificationSource = "TÜRKPATENT Coğrafi İşaret Tescil No 991 Envanteri",
                CoverImageUrl = "/images/islahiye_biberi.jpg",
                SignatureDishIds = "dish-islahiye-biberi",
                IsRecommended = true,
                OrderIndex = 3
            },
            new GastronomyPlace
            {
                Id = "place-dervisiye-semsek-ocagi",
                Slug = "dervisiye-semsek-ocagi",
                Name = "Dervişiye Köyü Şemsek Ocağı",
                Category = PlaceCategory.FirinBorekci,
                CategoryLabel = "Köy Fırını & Hamur Ocağı",
                Description = "Geleneksel sac ve tandır ateşinde hazırlanan, İslahiye Şemsek Böreği’nin otantik tarifle pişirildiği köy ocağı.",
                ShortAddress = "Dervişiye Köy İçi No: 12, İslahiye",
                FullAddress = "Dervişiye Köyü, Köy İçi No: 12, 27800 İslahiye / Gaziantep",
                District = "İslahiye",
                Neighborhood = "Dervişiye Mahallesi",
                OpeningHours = "07:30 – 17:00",
                Latitude = 37.0412,
                Longitude = 36.6189,
                HasVerifiedCoordinates = true,
                VerificationStatus = PlaceVerificationStatus.Verified,
                VerificationSource = "İslahiye Gastronomi Envanteri 2026 Saha Taraması",
                CoverImageUrl = "/images/semsek_boregi.jpg",
                SignatureDishIds = "dish-semsek-boregi",
                IsRecommended = true,
                OrderIndex = 4
            },
            new GastronomyPlace
            {
                Id = "place-aydinlik-kombe-firini",
                Slug = "aydinlik-kombe-firini",
                Name = "Aydınlık Mahalle Kömbe Fırını",
                Category = PlaceCategory.FirinBorekci,
                CategoryLabel = "Geleneksel Kömbe & Taş Fırın",
                Description = "Bayram ve özel günlerde 7 çeşit baharatla hazırlanan ve özel kömbe kalıplarıyla basılan İslahiye Kömbesi’nin pişirildiği fırın.",
                ShortAddress = "Aydınlık Mah., Güllü Cad. No: 5, İslahiye",
                FullAddress = "Aydınlık Mahallesi, Güllü Caddesi No: 5, 27800 İslahiye / Gaziantep",
                District = "İslahiye",
                Neighborhood = "Aydınlık Mahallesi",
                OpeningHours = "06:30 – 19:30",
                Latitude = 37.0218,
                Longitude = 36.6384,
                HasVerifiedCoordinates = true,
                VerificationStatus = PlaceVerificationStatus.Verified,
                VerificationSource = "İslahiye Gastronomi Envanteri 2026 Saha Taraması",
                CoverImageUrl = "/images/islahiye_kombesi.jpg",
                SignatureDishIds = "dish-islahiye-kombesi",
                IsRecommended = true,
                OrderIndex = 5
            },
            new GastronomyPlace
            {
                Id = "place-haci-ali-incir-noktasi",
                Slug = "haci-ali-incir-noktasi",
                Name = "Hacıali Dağ İnciri & Tatlı Atölyesi",
                Category = PlaceCategory.UreticiCiftlik,
                CategoryLabel = "Yöresel Tatlı & Üretim Noktası",
                Description = "Amanos eteklerinde yetişen doğal dağ incirlerinin cevizle doldurulup sütle demlendirildiği geleneksel İslahiye İncir Tatlısı üretim durağı.",
                ShortAddress = "Hacıali Öztürk Mah., Bağlar Yolu No: 19, İslahiye",
                FullAddress = "Hacıali Öztürk Mahallesi, Bağlar Yolu No: 19, 27800 İslahiye / Gaziantep",
                District = "İslahiye",
                Neighborhood = "Hacıali Öztürk Mahallesi",
                OpeningHours = "09:00 – 20:00",
                Latitude = 37.0345,
                Longitude = 36.6212,
                HasVerifiedCoordinates = true,
                VerificationStatus = PlaceVerificationStatus.Verified,
                VerificationSource = "İslahiye Gastronomi Envanteri 2026 Saha Taraması",
                CoverImageUrl = "/images/incir_tatlisi.jpg",
                SignatureDishIds = "dish-incir-tatlisi",
                IsRecommended = true,
                OrderIndex = 6
            }
        ];
    }

    private static List<CulturalHeritageStory> GetSeedStories()
    {
        return
        [
            new CulturalHeritageStory
            {
                Id = "story-tas-firin-ve-mese-kozu",
                Slug = "tas-firin-ve-mese-kozu",
                Title = "Taş Fırının Meşe Közü: Asırlık Ocaklık Hafızası",
                Subtitle = "Sabahın ilk ışıklarıyla alevlenen meşe odunları, bakır tepsilerde demlenen lezzet ve İslahiye çarşısının fırın geleneği.",
                Theme = StoryTheme.UretimTeknigi,
                ThemeLabel = "Pişirme Usulleri & Fırın Kültürü",
                Summary = "İslahiye’de mutfak kültürü yalnızca evlerin ocaklarında değil, mahallelerin kalbinde yer alan asırlık taş fırınlarda şekillenir.",
                Content = "İslahiye’de mutfak kültürü yalnızca evlerin ocaklarında değil, mahallelerin kalbinde yer alan asırlık taş fırınlarda şekillenir. Sabahın erken saatlerinde meşe odunu ateşiyle ısınan bu fırınlar, tüm çarşı esnafının ve ailelerin ortak lezzet ocağıdır. Geleneksel taş fırınların en ayırt edici özelliği, ateşin doğrudan yemeğe değil, taban taşına ve fırının tonoz kubbesine nüfuz etmesidir. Meşe odununun çıkardığı is kokusuz temiz köz, bakır tepsideki kuzu etinin ve sebzelerin suyunu kaybetmeden, kendi buharında demlenerek pişmesini sağlar.",
                CoverImageUrl = "/images/islahiye_tava.jpg",
                RelatedDishIds = "dish-islahiye-tava,dish-islahiye-kombesi",
                AuthorOrSource = "İslahiye Lezzet Atlası Kültürel Araştırma Ekibi",
                ReadTimeMinutes = 4,
                IsFeatured = true,
                OrderIndex = 1
            },
            new CulturalHeritageStory
            {
                Id = "story-islahiye-biberi-ve-sonbahar-sergileri",
                Slug = "islahiye-biberi-ve-sonbahar-sergileri",
                Title = "Güneşin Kızıla Boyadığı Ova: İslahiye Biberi",
                Subtitle = "Amanos rüzgârıyla kuruyan, taş dibeklerde işlenen ve TÜRKPATENT nezdinde tescillenen kırmızı mirasın hikâyesi.",
                Theme = StoryTheme.MevsimselRituel,
                ThemeLabel = "Hasat & Mevsimler",
                Summary = "Eylül ayı geldiğinde İslahiye Ovası baştan başa kızıla bürünür. 991 tescil numaralı İslahiye Biberi’nin kadim öyküsü.",
                Content = "Eylül ayı geldiğinde İslahiye Ovası baştan başa kızıla bürünür. Bereketli alüvyon topraklarda yetişen ve 05.01.2022 tarihinde 991 tescil numarasıyla tescillenen İslahiye Biberi, yakıcı acılıktan ziyade meyvemsi aromasıyla Anadolu mutfağının en kıymetli baharatlarındandır. Hasat edilen taze kırmızı biberler elle saplarından ayrılır, temizlenir ve temiz keten sergiler üzerinde güneşin altına yayılır. Rüzgârın ve güneşin dengeli kurutması, biberin içindeki uçucu yağların ve doğal parlak yakut renginin korunmasını sağlar. Kurutulan biberler zeytinyağı ile hafifçe ovularak geleneksel taş dibeklerde dövülür.",
                CoverImageUrl = "/images/islahiye_biberi.jpg",
                RelatedDishIds = "dish-islahiye-biberi,dish-islahiye-tava",
                AuthorOrSource = "İslahiye Ticaret Odası Coğrafi İşaret Komisyonu",
                ReadTimeMinutes = 5,
                IsFeatured = true,
                OrderIndex = 2
            },
            new CulturalHeritageStory
            {
                Id = "story-firik-ve-atesin-hafizasi",
                Slug = "firik-ve-atesin-hafizasi",
                Title = "Ateşle Olgunlaşan Yeşil Buğday: Firik Mirası",
                Subtitle = "Başaktayken alevde tütsülenen sert durum buğdayının is kokusu ve kadim Mezopotamya mirası.",
                Theme = StoryTheme.MutfakGelenegi,
                ThemeLabel = "Mutfak Gelenekleri",
                Summary = "Firik, buğdayın henüz tam sararmadan, tanelerin süt olum döneminde hasat edilip başaklarıyla birlikte açık alevde tütsülenmesiyle elde edilen antik bir tahıldır.",
                Content = "Firik, buğdayın henüz tam sararmadan süt olum döneminde hasat edilip açık alevde tütsülenmesiyle elde edilen antik bir tahıldır. İslahiye ve çevresinde yüzyıllardır uygulanan bu yöntem, buğdaya eşsiz bir isli rayiha kazandırır. Taş değirmende hafifçe kırılan firik, pilav tenceresinde köy tereyağı, kuzu eti suyu ve nohutla buluşur.",
                CoverImageUrl = "/images/firik_pilavi.jpg",
                RelatedDishIds = "dish-firik-pilavi",
                AuthorOrSource = "İslahiye Lezzet Atlası Saha Arşivi",
                ReadTimeMinutes = 4,
                IsFeatured = true,
                OrderIndex = 3
            },
            new CulturalHeritageStory
            {
                Id = "story-ahsap-kalip-ve-bayram-kombesi",
                Slug = "ahsap-kalip-ve-bayram-kombesi",
                Title = "Oymalı Ahşap Kalıplar ve Bayram Kömbesi",
                Subtitle = "Gürgen ve ceviz ağacına nakşedilen geleneksel motifler, yedi baharatın kokusu ve bayram imecesi.",
                Theme = StoryTheme.UretimTeknigi,
                ThemeLabel = "Geleneksel Mutfak Araçları",
                Summary = "İslahiye’de bayram hazırlıklarının simgesi, mutfak sandıklarından çıkarılan el oyması ahşap kömbe kalıplarıdır.",
                Content = "İslahiye’de bayram hazırlıklarının simgesi, mutfak sandıklarından çıkarılan el oyması ahşap kömbe kalıplarıdır. Yöresel marangozların ceviz ağacından oyduğu bu kalıplar, nesiller boyunca anneden kıza aktarılan aile yadigârlarıdır. Mahlep, tarçın, zencefil, karanfil, muskat ve damla sakızından oluşan özel baharat harmanıyla yoğrulan kömbe, taş fırında ağır ağır kurutularak pişirilir.",
                CoverImageUrl = "/images/islahiye_kombesi.jpg",
                RelatedDishIds = "dish-islahiye-kombesi",
                AuthorOrSource = "İslahiye Mutfak Kültürü Araştırma Grubu",
                ReadTimeMinutes = 3,
                IsFeatured = true,
                OrderIndex = 4
            },
            new CulturalHeritageStory
            {
                Id = "story-tandir-ve-semsek-boregi-ritueli",
                Slug = "tandir-ve-semsek-boregi-ritueli",
                Title = "Tandır Ateşi ve Şemsek İmecesi: Köy Odalarının Kadim Mirası",
                Subtitle = "İncecik açılan yufkaların kıymalı harçla buluşup sac üzerinde çıtırdayarak kabardığı İslahiye köy ritüeli.",
                Theme = StoryTheme.MutfakGelenegi,
                ThemeLabel = "Mutfak Gelenekleri",
                Summary = "Şemsek Böreği, İslahiye köylerinde hasat sonu, düğün ve bayram sabahlarında kadınların sac başında toplandığı en samimi imece lezzetidir.",
                Content = "Şemsek Böreği, İslahiye köylerinde hasat sonu, düğün ve bayram sabahlarında kadınların sac başında toplandığı en samimi imece lezzetidir. Dervişiye ve Fevzi Çakmak ocaklarında harlanan meşe odunu ateşi, hamurun gevrek ve sulu pişmesini sağlar. Şemsek harcında Amanos yaylalarında otlayan kıvırcık kuzu kıyması ve İslahiye pul biberi harmanlanır.",
                CoverImageUrl = "/images/semsek_boregi.jpg",
                RelatedDishIds = "dish-semsek-boregi",
                AuthorOrSource = "İslahiye Lezzet Atlası Kültürel Bellek Grubu",
                ReadTimeMinutes = 4,
                IsFeatured = true,
                OrderIndex = 5
            },
            new CulturalHeritageStory
            {
                Id = "story-dag-inciri-ve-ceviz-hasadi",
                Slug = "dag-inciri-ve-ceviz-hasadi",
                Title = "Amanos Dağ İnciri ve Cevizli Tatlı Geleneği",
                Subtitle = "Güneşte kurutulan dağ incirlerinin süt ve cevizle tencerede ağır ağır demlendiği kış ziyafeti.",
                Theme = StoryTheme.MevsimselRituel,
                ThemeLabel = "Hasat & Mevsimler",
                Summary = "Amanos Dağları’nın serin rüzgârlarında olgunlaşan yabani dağ incirleri, sonbaharda toplanıp gölgede kurutulur.",
                Content = "Amanos Dağları’nın serin rüzgârlarında olgunlaşan yabani dağ incirleri, sonbaharda toplanıp gölgede kurutulur. Kış aylarında İslahiye evlerinde ceviz içiyle doldurulup sütte demlendirilerek en asil tatlıya dönüştürülür. Ekstra rafine şeker kullanılmadan, yalnızca incirin kendi balı ve sütün tatlılığıyla pişen bu tatlı, İslahiye’nin en eski hafif kış ikramıdır.",
                CoverImageUrl = "/images/incir_tatlisi.jpg",
                RelatedDishIds = "dish-incir-tatlisi",
                AuthorOrSource = "Amanos Yerel Saha Kayıtları",
                ReadTimeMinutes = 3,
                IsFeatured = true,
                OrderIndex = 6
            }
        ];
    }

    private static List<GastronomyFilm> GetSeedFilms()
    {
        return
        [
            new GastronomyFilm
            {
                Id = "film-tas-firin-ve-ocaklik",
                Slug = "tas-firin-ve-ocaklik",
                EpisodeNumber = 1,
                Title = "Taş Fırın & Meşe Közü",
                Subtitle = "Odun ateşinin kor közleri ve ocaklık atmosferi.",
                Description = "Geleneksel taş fırın ocaklığında yanan meşe odunu ve fırın tabanındaki kor közlerin sinematik atmosfer klibi.",
                DurationSeconds = 5,
                VideoUrl = "/videos/tas-firin-ve-ocaklik.mp4",
                ThumbnailUrl = "/images/tas_firin_kozu_poster.jpg",
                Theme = "Taş Fırın & Meşe Ateşi",
                FeaturedDishId = "dish-islahiye-tava",
                IsFeatured = true,
                OrderIndex = 1
            },
            new GastronomyFilm
            {
                Id = "film-geleneksel-hamur-hazirlama",
                Slug = "geleneksel-hamur-hazirlama",
                EpisodeNumber = 2,
                Title = "Geleneksel Hamur Zanaatı",
                Subtitle = "Unlu tezgâhta hamur açma ve yoğurma zanaatı.",
                Description = "Fırıncı tezgâhında un serpilerek hamur yoğurma ve açma hareketlerinin yakın plan zanaat klibi.",
                DurationSeconds = 5,
                VideoUrl = "/videos/geleneksel-hamur-hazirlama.mp4",
                ThumbnailUrl = "/images/hamur_zanaati_poster.jpg",
                Theme = "Hamur Zanaatı & Sac Kültürü",
                FeaturedDishId = "dish-semsek-boregi",
                IsFeatured = true,
                OrderIndex = 2
            },
            new GastronomyFilm
            {
                Id = "film-biber-hasadi-ve-kurutma",
                Slug = "biber-hasadi-ve-kurutma",
                EpisodeNumber = 3,
                Title = "Közde İslahiye Biberi",
                Subtitle = "Ateşin üzerinde demlenen taze kırmızı biberler.",
                Description = "Meşe közünün üzerinde cızırdayarak közlenen taze İslahiye biberlerinin kokusu ve dumanı.",
                DurationSeconds = 5,
                VideoUrl = "/videos/biber-hasadi-ve-kurutma.mp4",
                ThumbnailUrl = "/images/biber_kozleme_poster.jpg",
                Theme = "Tescilli İslahiye Biberi & Közleme",
                FeaturedDishId = "dish-islahiye-biberi",
                IsFeatured = true,
                OrderIndex = 3
            }
        ];
    }

    private static List<NewsEvent> GetSeedNewsEvents()
    {
        return
        [
            new NewsEvent
            {
                Id = "news-biber-hasat-gunleri",
                Slug = "islahiye-biber-hasat-gunleri-2026",
                Title = "Geleneksel İslahiye Biberi Hasat ve Kültür Günleri",
                Type = "etkinlik",
                Summary = "TÜRKPATENT tescilli İslahiye Biberi’nin hasat dönemi münasebetiyle ovanın sergilerinde üretici ve gastronomi buluşması düzenleniyor.",
                Content = "İslahiye Ovası'nda sonbaharın gelişiyle başlayan biber hasadı, üreticilerimizin ve gastronomi meraklılarının katılımıyla kutlanacak. Taş dibek dövme atölyeleri ve geleneksel tava pişirimleri sergilenecektir.",
                CoverImageUrl = "/images/islahiye_biberi.jpg",
                PublishedAt = DateTimeOffset.UtcNow.AddDays(-7),
                EventDate = DateTimeOffset.UtcNow.AddDays(30),
                Location = "İslahiye Ovası Beyler Sergi Alanı",
                IsPublished = true
            },
            new NewsEvent
            {
                Id = "news-tas-firin-mirasi",
                Slug = "islahiye-tas-firin-envanteri",
                Title = "İslahiye Taş Fırınları Mutfak Envanteri Dijital Yayında",
                Type = "haber",
                Summary = "Asırlık çarşı fırınlarının mimari yapısı, meşe odunu közleme teknikleri ve tescilli tava mirası dijital platformda erişime açıldı.",
                Content = "İslahiye Dijital Platformlar Projesi kapsamında hazırlanan 'Gastronomi ve Lezzet Atlası', ilçemizin taş fırın geleneğini adım adım belgeleyerek araştırmacıların ve ziyaretçilerin hizmetine sunuyor.",
                CoverImageUrl = "/images/islahiye_tava.jpg",
                PublishedAt = DateTimeOffset.UtcNow.AddDays(-14),
                IsPublished = true
            }
        ];
    }
}

