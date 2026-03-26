const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateInput(value) {
    if (!value) {
        return null;
    }

    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
}

function getTodayUtc() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function calculateStayDetails(listingDoc, bookingInput) {
    const checkIn = parseDateInput(bookingInput.checkIn);
    const checkOut = parseDateInput(bookingInput.checkOut);
    const guests = Number(bookingInput.guests);

    if (!checkIn || !checkOut) {
        throw new Error("Please provide valid check-in and check-out dates.");
    }

    if (checkIn < getTodayUtc()) {
        throw new Error("Check-in date cannot be in the past.");
    }

    const nights = (checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY;
    if (!Number.isInteger(nights) || nights < 1) {
        throw new Error("Check-out must be after check-in.");
    }

    if (!Number.isInteger(guests) || guests < 1) {
        throw new Error("Guests must be at least 1.");
    }

    const nightlyPrice = Number(listingDoc.price);
    if (!Number.isFinite(nightlyPrice) || nightlyPrice < 0) {
        throw new Error("This listing does not have a valid nightly price.");
    }

    return {
        checkIn,
        checkOut,
        guests,
        nights,
        nightlyPrice,
        subtotal: nightlyPrice * nights,
    };
}

function formatListingLocation(listingDoc) {
    return [listingDoc.location, listingDoc.country].filter(Boolean).join(", ");
}

function buildCartItem(listingDoc, bookingInput) {
    return {
        listing: listingDoc._id,
        title: listingDoc.title,
        image: listingDoc.image,
        location: formatListingLocation(listingDoc),
        ...calculateStayDetails(listingDoc, bookingInput),
    };
}

function calculateCartTotals(items = []) {
    return items.reduce(
        (totals, item) => {
            totals.itemCount += 1;
            totals.totalNights += Number(item.nights || 0);
            totals.subtotal += Number(item.subtotal || 0);
            return totals;
        },
        { itemCount: 0, totalNights: 0, subtotal: 0 }
    );
}

module.exports = {
    buildCartItem,
    calculateCartTotals,
    calculateStayDetails,
    parseDateInput,
};
