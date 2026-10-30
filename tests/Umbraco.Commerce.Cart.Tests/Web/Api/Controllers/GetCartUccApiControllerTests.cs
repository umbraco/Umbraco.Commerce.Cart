using Microsoft.AspNetCore.Mvc;
using Moq;
using Umbraco.Commerce.Cart.Tests.Support;
using Umbraco.Commerce.Cart.Web.Api.Controllers;
using Umbraco.Commerce.Cart.Web.Api.Models;
using Umbraco.Commerce.Core.Api;
using Umbraco.Commerce.Core.Models;

namespace Umbraco.Commerce.Cart.Tests.Web.Api.Controllers;

// Covers how the Store header is read: a GUID is a store id, anything else is a store alias.
[Collection(CommerceServiceLocatorCollection.Name)]
public sealed class GetCartUccApiControllerTests : IDisposable
{
    private static readonly Guid CurrencyId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private readonly CommerceModelBuilder.CurrencyServices _currencyServices = new(
        CommerceModelBuilder.CreateCurrency(CurrencyId, "en-GB", "£{0}"));

    private readonly Mock<IUmbracoCommerceApi> _api = new();
    private readonly GetCartUccApiController _controller;
    private readonly StoreReadOnly _store;

    public GetCartUccApiControllerTests()
    {
        var storeState = CommerceModelBuilder.Construct<StoreState>(CommerceModelBuilder.StoreId, true);
        _store = CommerceModelBuilder.Construct<StoreReadOnly>(storeState);

        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(x => x.GetService(typeof(IUmbracoCommerceApi))).Returns(_api.Object);

        _controller = new GetCartUccApiController(_api.Object, serviceProvider.Object);
    }

    public void Dispose() => _currencyServices.Dispose();

    [Fact]
    public async Task GetCart_WhenStoreIsAGuid_LooksTheStoreUpById()
    {
        _api.Setup(x => x.GetStoreAsync(_store.Id)).ReturnsAsync(_store);

        await _controller.GetCart(new StoreSessionDto { Store = _store.Id.ToString() });

        _api.Verify(x => x.GetStoreAsync(_store.Id), Times.Once);
        _api.Verify(x => x.GetStoreAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetCart_WhenStoreIsNotAGuid_LooksTheStoreUpByAlias()
    {
        _api.Setup(x => x.GetStoreAsync("my-store")).ReturnsAsync(_store);

        await _controller.GetCart(new StoreSessionDto { Store = "my-store" });

        _api.Verify(x => x.GetStoreAsync("my-store"), Times.Once);
        _api.Verify(x => x.GetStoreAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task GetCart_WhenThereIsNoCurrentOrder_ReturnsOkWithNoBody()
    {
        _api.Setup(x => x.GetStoreAsync("my-store")).ReturnsAsync(_store);
        _api.Setup(x => x.GetCurrentOrderAsync(_store.Id)).ReturnsAsync((OrderReadOnly?)null);

        var result = await _controller.GetCart(new StoreSessionDto { Store = "my-store" });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Null(ok.Value);
    }

    [Fact]
    public async Task GetCart_WhenThereIsACurrentOrder_ReturnsTheMappedCart()
    {
        var order = CommerceModelBuilder.Order(CurrencyId)
            .WithSubtotal(CommerceModelBuilder.Price(10m, 2m, CurrencyId))
            .Build();
        _api.Setup(x => x.GetStoreAsync("my-store")).ReturnsAsync(_store);
        _api.Setup(x => x.GetCurrentOrderAsync(_store.Id)).ReturnsAsync(order);

        var result = await _controller.GetCart(new StoreSessionDto { Store = "my-store" });

        var cart = Assert.IsType<CartDto>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Equal(order.Id, cart.Id);
        Assert.Equal("£12.00", cart.Subtotal.WithTax);
    }
}
