using Microsoft.Extensions.DependencyInjection;
using Moq;
using Umbraco.Commerce.Cart.Tests.Support;
using Umbraco.Commerce.Cart.Web.Api.Models;
using Umbraco.Commerce.Cart.Web.Api.Models.Factories;
using Umbraco.Commerce.Core.Api;
using Umbraco.Commerce.Core.Models;

namespace Umbraco.Commerce.Cart.Tests.Web.Api.Models.Factories;

// Price formatting goes through Commerce's static service locator, so these tests can't run in parallel
// with anything else that swaps it.
[Collection(CommerceServiceLocatorCollection.Name)]
public sealed class CartModelFactoryTests : IDisposable
{
    private static readonly Guid CurrencyId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private readonly CommerceModelBuilder.CurrencyServices _currencyServices;
    private readonly Mock<IUmbracoCommerceApi> _api = new();
    private readonly MappingContext _ctx;

    public CartModelFactoryTests()
    {
        _currencyServices = new CommerceModelBuilder.CurrencyServices(
            CommerceModelBuilder.CreateCurrency(CurrencyId, "en-GB", "£{0}"));

        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(x => x.GetService(typeof(IUmbracoCommerceApi))).Returns(_api.Object);
        _ctx = new MappingContext(serviceProvider.Object);
    }

    public void Dispose() => _currencyServices.Dispose();

    private static Price P(decimal withoutTax, decimal tax) => CommerceModelBuilder.Price(withoutTax, tax, CurrencyId);

    private static CommerceModelBuilder.OrderBuilder Order() => CommerceModelBuilder.Order(CurrencyId);

    private void SetupProduct(string productReference, IProductSnapshot? product)
        => _api
            .Setup(x => x.GetProductAsync(CommerceModelBuilder.StoreId, productReference, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

    [Fact]
    public async Task EntityToDtoAsync_MapsTheOrderId()
    {
        var order = Order().WithSubtotal(P(0, 0)).Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Equal(order.Id, dto.Id);
    }

    [Fact]
    public async Task EntityToDtoAsync_WithNoOrderLines_ReturnsNoItems()
    {
        var order = Order().WithSubtotal(P(0, 0)).Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Empty(dto.Items);
    }

    [Fact]
    public async Task EntityToDtoAsync_FormatsTheSubtotalWithTaxTaxAndWithoutTax()
    {
        var order = Order().WithSubtotal(P(1000m, 250m)).Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Equal("£1,250.00", dto.Subtotal.WithTax);
        Assert.Equal("£250.00", dto.Subtotal.Tax);
        Assert.Equal("£1,000.00", dto.Subtotal.WithoutTax);
    }

    [Fact]
    public async Task EntityToDtoAsync_ShowsTheSubtotalBeforeDiscounts()
    {
        var order = Order().WithSubtotal(P(100m, 20m), discountedValue: P(80m, 16m)).Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Equal("£120.00", dto.Subtotal.WithTax);
    }

    [Fact]
    public async Task EntityToDtoAsync_MapsAProductLine()
    {
        var order = Order()
            .WithSubtotal(P(30m, 0m))
            .WithLine(l =>
            {
                l.ProductReference = "shirt";
                l.ProductVariantReference = "shirt-blue-m";
                l.Sku = "SHIRT-BLU-M";
                l.Name = "Blue shirt";
                l.Quantity = 3;
                l.UnitPrice = P(10m, 2m);
                l.TotalPrice = P(30m, 6m);
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var item = Assert.Single(dto.Items);
        Assert.Equal(order.OrderLines.Single().Id, item.Id);
        Assert.Equal("shirt", item.ProductReference);
        Assert.Equal("shirt-blue-m", item.ProductVariantReference);
        Assert.Equal("SHIRT-BLU-M", item.Sku);
        Assert.Equal("Blue shirt", item.Name);
        Assert.Equal(3m, item.Quantity);
    }

    [Fact]
    public async Task EntityToDtoAsync_FormatsLineUnitPriceAndTotal()
    {
        var order = Order()
            .WithSubtotal(P(30m, 6m))
            .WithLine(l =>
            {
                l.UnitPrice = P(10m, 2m);
                l.TotalPrice = P(30m, 6m);
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var item = Assert.Single(dto.Items);
        Assert.Equal("£12.00", item.UnitPrice.WithTax);
        Assert.Equal("£2.00", item.UnitPrice.Tax);
        Assert.Equal("£10.00", item.UnitPrice.WithoutTax);
        Assert.Equal("£36.00", item.Total.WithTax);
        Assert.Equal("£6.00", item.Total.Tax);
        Assert.Equal("£30.00", item.Total.WithoutTax);
    }

    [Fact]
    public async Task EntityToDtoAsync_ShowsLinePricesBeforeAdjustments()
    {
        var order = Order()
            .WithSubtotal(P(10m, 0m))
            .WithLine(l =>
            {
                l.UnitPrice = P(10m, 0m);
                l.UnitPriceValue = P(8m, 0m);
                l.TotalPrice = P(20m, 0m);
                l.TotalPriceValue = P(16m, 0m);
                l.Quantity = 2;
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var item = Assert.Single(dto.Items);
        Assert.Equal("£10.00", item.UnitPrice.WithTax);
        Assert.Equal("£20.00", item.Total.WithTax);
    }

    [Fact]
    public async Task EntityToDtoAsync_MapsPropertiesAndSkipsServerSideOnlyOnes()
    {
        var order = Order()
            .WithSubtotal(P(0, 0))
            .WithLine(l =>
            {
                l.Properties["engraving"] = new PropertyValue("Happy birthday");
                l.Properties["costPrice"] = new PropertyValue("4.20", isServerSideOnly: true);
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var item = Assert.Single(dto.Items);
        var property = Assert.Single(item.Properties);
        Assert.Equal("engraving", property.Key);
        Assert.Equal("Happy birthday", property.Value);
    }

    [Fact]
    public async Task EntityToDtoAsync_MapsAttributesByNameToValueName()
    {
        var order = Order()
            .WithSubtotal(P(0, 0))
            .WithLine(l =>
            {
                l.Attributes.Add(new AttributeCombination(new AttributeName("size", "Size"), new AttributeValue("m", "Medium")));
                l.Attributes.Add(new AttributeCombination(new AttributeName("colour", "Colour"), new AttributeValue("blue", "Blue")));
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var item = Assert.Single(dto.Items);
        Assert.Equal(2, item.Attributes.Count);
        Assert.Equal("Medium", item.Attributes["Size"]);
        Assert.Equal("Blue", item.Attributes["Colour"]);
    }

    [Fact]
    public async Task EntityToDtoAsync_WhenProductHasAnImage_MapsTheImageUrl()
    {
        var product = new Mock<IProductSnapshotWithImage>();
        product.Setup(x => x.ImageUrl).Returns("/media/shirt.jpg");
        SetupProduct("shirt", product.Object);
        var order = Order().WithSubtotal(P(0, 0)).WithLine(l => l.ProductReference = "shirt").Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Equal("/media/shirt.jpg", Assert.Single(dto.Items).ImageUrl);
    }

    [Fact]
    public async Task EntityToDtoAsync_WhenProductSnapshotHasNoImageSupport_LeavesTheImageUrlEmpty()
    {
        SetupProduct("shirt", Mock.Of<IProductSnapshot>());
        var order = Order().WithSubtotal(P(0, 0)).WithLine(l => l.ProductReference = "shirt").Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Null(Assert.Single(dto.Items).ImageUrl);
    }

    [Fact]
    public async Task EntityToDtoAsync_WhenProductCannotBeResolved_LeavesTheImageUrlEmpty()
    {
        SetupProduct("shirt", null);
        var order = Order().WithSubtotal(P(0, 0)).WithLine(l => l.ProductReference = "shirt").Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Null(Assert.Single(dto.Items).ImageUrl);
    }

    [Fact]
    public async Task EntityToDtoAsync_ResolvesTheProductFromTheOrderLinesStore()
    {
        var order = Order().WithSubtotal(P(0, 0)).WithLine(l => l.ProductReference = "shirt").Build();

        await CartModelFactory.EntityToDtoAsync(_ctx, order);

        _api.Verify(
            x => x.GetProductAsync(CommerceModelBuilder.StoreId, "shirt", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EntityToDtoAsync_LooksUpTheVariantInTheOrdersLanguage()
    {
        var order = Order().WithLanguage("da-DK").WithSubtotal(P(0, 0))
            .WithLine(l => { l.ProductReference = "shirt"; l.ProductVariantReference = "shirt-red"; })
            .Build();

        await CartModelFactory.EntityToDtoAsync(_ctx, order);

        _api.Verify(
            x => x.GetProductAsync(CommerceModelBuilder.StoreId, "shirt", "shirt-red", "da-DK", It.IsAny<CancellationToken>()),
            Times.Once);
        _api.Verify(
            x => x.GetProductAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EntityToDtoAsync_ForAPlainLine_IsNotMarkedAsABundle()
    {
        var order = Order().WithSubtotal(P(0, 0)).WithLine(l => l.UnitPrice = P(1m, 0m)).Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var item = Assert.Single(dto.Items);
        Assert.Null(item.BundleReference);
        Assert.Null(item.BasePrice);
        Assert.Null(item.Items);
    }

    [Fact]
    public async Task EntityToDtoAsync_ForABundleLine_MapsTheBundleReference()
    {
        var order = Order().WithSubtotal(P(0, 0)).WithLine(l => l.BundleId = "bundle-42").Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Equal("bundle-42", Assert.Single(dto.Items).BundleReference);
    }

    [Fact]
    public async Task EntityToDtoAsync_ForABundleLine_FormatsTheBasePriceBeforeAdjustments()
    {
        var order = Order()
            .WithSubtotal(P(0, 0))
            .WithLine(l =>
            {
                l.BundleId = "bundle-42";
                l.BasePrice = P(50m, 10m);
                l.BasePriceValue = P(40m, 8m);
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var basePrice = Assert.Single(dto.Items).BasePrice!;
        Assert.Equal("£60.00", basePrice.WithTax);
        Assert.Equal("£10.00", basePrice.Tax);
        Assert.Equal("£50.00", basePrice.WithoutTax);
    }

    [Fact]
    public async Task EntityToDtoAsync_ForABundleLine_MapsEachBundledItem()
    {
        var order = Order()
            .WithSubtotal(P(0, 0))
            .WithLine(l =>
            {
                l.BundleId = "bundle-42";
                l.ProductReference = "gift-box";
                l.WithChild(c =>
                {
                    c.ProductReference = "candle";
                    c.ProductVariantReference = "candle-lavender";
                    c.Sku = "CANDLE-LAV";
                    c.Name = "Lavender candle";
                    c.Quantity = 2;
                    c.UnitPrice = P(5m, 1m);
                    c.TotalPrice = P(10m, 2m);
                });
                l.WithChild(c =>
                {
                    c.ProductReference = "soap";
                    c.Name = "Soap";
                });
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        var bundle = Assert.Single(dto.Items);
        Assert.Equal(2, bundle.Items.Count());

        var candle = bundle.Items.Single(x => x.ProductReference == "candle");
        Assert.Equal("candle-lavender", candle.ProductVariantReference);
        Assert.Equal("CANDLE-LAV", candle.Sku);
        Assert.Equal("Lavender candle", candle.Name);
        Assert.Equal(2m, candle.Quantity);
        Assert.Equal("£6.00", candle.UnitPrice.WithTax);
        Assert.Equal("£12.00", candle.Total.WithTax);
        Assert.Contains(bundle.Items, x => x.ProductReference == "soap");
    }

    [Fact]
    public async Task EntityToDtoAsync_ForBundledItems_ResolvesProductImages()
    {
        var product = new Mock<IProductSnapshotWithImage>();
        product.Setup(x => x.ImageUrl).Returns("/media/candle.jpg");
        SetupProduct("candle", product.Object);
        var order = Order()
            .WithSubtotal(P(0, 0))
            .WithLine(l =>
            {
                l.BundleId = "bundle-42";
                l.WithChild(c => c.ProductReference = "candle");
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Equal("/media/candle.jpg", Assert.Single(Assert.Single(dto.Items).Items).ImageUrl);
    }

    [Fact]
    public async Task EntityToDtoAsync_MapsEveryTopLevelLineInOrder()
    {
        var order = Order()
            .WithSubtotal(P(0, 0))
            .WithLine(l => l.Name = "First")
            .WithLine(l => l.Name = "Second")
            .WithLine(l =>
            {
                l.Name = "Third (bundle)";
                l.BundleId = "bundle-1";
            })
            .Build();

        var dto = await CartModelFactory.EntityToDtoAsync(_ctx, order);

        Assert.Equal(["First", "Second", "Third (bundle)"], dto.Items.Select(x => x.Name));
    }
}
