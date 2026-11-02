using Umbraco.Commerce.Cart.Web.Api.Controllers;
using Umbraco.Commerce.Cart.Web.Api.Models;

namespace Umbraco.Commerce.Cart.Tests.Web.Api.Controllers;

public class AddToCartUccApiControllerTests
{
    private static AddToCartResponseBaseDto BundleItem(string productReference)
        => new() { ProductReference = productReference };

    [Fact]
    public void ResolveBundleReference_WithBundleItemsAndNoReference_GeneratesAReference()
    {
        var model = new AddToCartRequestDto
        {
            ProductReference = "gift-box",
            BundleItems = [BundleItem("candle")],
        };

        var reference = AddToCartUccApiController.ResolveBundleReference(model);

        Assert.True(Guid.TryParse(reference, out var parsed));
        Assert.NotEqual(Guid.Empty, parsed);
    }

    [Fact]
    public void ResolveBundleReference_WithBundleItemsAndNoReference_GeneratesADifferentReferenceEachTime()
    {
        var model = new AddToCartRequestDto
        {
            ProductReference = "gift-box",
            BundleItems = [BundleItem("candle")],
        };

        var first = AddToCartUccApiController.ResolveBundleReference(model);
        var second = AddToCartUccApiController.ResolveBundleReference(model);

        Assert.NotEqual(first, second);
    }

    [Fact]
    public void ResolveBundleReference_WithBundleItemsAndAReference_KeepsTheReference()
    {
        var model = new AddToCartRequestDto
        {
            ProductReference = "gift-box",
            BundleReference = "my-bundle",
            BundleItems = [BundleItem("candle")],
        };

        Assert.Equal("my-bundle", AddToCartUccApiController.ResolveBundleReference(model));
    }

    [Fact]
    public void ResolveBundleReference_WithoutBundleItemsOrReference_ReturnsNull()
    {
        var model = new AddToCartRequestDto { ProductReference = "shirt" };

        Assert.Null(AddToCartUccApiController.ResolveBundleReference(model));
    }

    [Fact]
    public void ResolveBundleReference_WithAnEmptyBundleItemList_DoesNotGenerateAReference()
    {
        var model = new AddToCartRequestDto { ProductReference = "shirt", BundleItems = [] };

        Assert.Null(AddToCartUccApiController.ResolveBundleReference(model));
    }

    [Fact]
    public void ResolveBundleReference_WithoutBundleItemsButAReference_KeepsTheReference()
    {
        var model = new AddToCartRequestDto { ProductReference = "shirt", BundleReference = "my-bundle" };

        Assert.Equal("my-bundle", AddToCartUccApiController.ResolveBundleReference(model));
    }
}
