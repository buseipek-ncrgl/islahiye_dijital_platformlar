namespace Gastronomy.Domain;

public enum DishCategory
{
    TavaEt = 0,
    Corba = 1,
    DolmaSarma = 2,
    HamurIsi = 3,
    Tatli = 4,
    MezeSalata = 5,
    OzelLezzet = 6
}

public enum PublicationStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}

public enum VerificationStatus
{
    Unverified = 0,
    PendingVerification = 1,
    Verified = 2
}

public enum PlaceCategory
{
    TarihiLokanta = 0,
    FirinBorekci = 1,
    Kebapci = 2,
    Kahvaltici = 3,
    Tatlici = 4,
    UreticiCiftlik = 5
}

public enum PlaceVerificationStatus
{
    Verified = 0,
    Pending = 1,
    Historical = 2
}

public enum StoryTheme
{
    KulturelKoken = 0,
    MevsimselRituel = 1,
    SofraAdabi = 2,
    KadinEmegi = 3,
    UretimTeknigi = 4,
    MutfakGelenegi = 5
}

public enum MediaType
{
    Image = 0,
    Video = 1,
    Document = 2
}

public enum MediaOrigin
{
    LocalField = 0,
    StockEditorial = 1,
    AiIllustrative = 2
}

