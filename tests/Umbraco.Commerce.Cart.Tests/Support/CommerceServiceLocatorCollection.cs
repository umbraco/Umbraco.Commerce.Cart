namespace Umbraco.Commerce.Cart.Tests.Support;

/// <summary>
/// Tests that swap Commerce's static service locator share this collection so they run one at a time.
/// </summary>
[CollectionDefinition(Name)]
public sealed class CommerceServiceLocatorCollection
{
    public const string Name = "Commerce service locator";
}
