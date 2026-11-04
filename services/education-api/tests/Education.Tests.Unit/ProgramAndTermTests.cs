using Education.Domain;

namespace Education.Tests.Unit;

public sealed class ProgramAndTermTests
{
    [Fact] public void Program_rejects_invalid_slug() => Assert.Throws<DomainValidationException>(() => new EducationProgram("Program", "Geçersiz Slug", "", "", "", ""));
    [Fact] public void Term_rejects_end_before_start() => Assert.Throws<DomainValidationException>(() => new EducationTerm(Guid.NewGuid(), "2027 Bahar", new(2027, 3, 1), new(2027, 2, 1), DateTime.UtcNow, DateTime.UtcNow.AddDays(1), 20));
    [Fact] public void Term_rejects_invalid_capacity() => Assert.Throws<DomainValidationException>(() => new EducationTerm(Guid.NewGuid(), "2027 Bahar", new(2027, 3, 1), new(2027, 4, 1), DateTime.UtcNow.AddDays(-2), DateTime.UtcNow.AddDays(-1), 0));
    [Fact] public void Program_status_changes_explicitly() { var p = new EducationProgram("Program", "program", "", "", "", ""); p.ChangeStatus(PublicationStatus.Published); Assert.Equal(PublicationStatus.Published, p.Status); }
}
