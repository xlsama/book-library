import * as cheerio from 'cheerio';

enum State {
  Pending, //未开始
  Ready, //可约
  Fulled //约满
}

subscribe('2022-12-30');

async function subscribe(day: string) {
  const data = await parseHTMLData();
  const orders = Array.from(data as ArrayLike<any>);
  const order = orders.find(order => order.day === day);
  if (!order) {
    console.log('This date is not available.');
    return;
  }
  await verifyOrder(order);
  submit(order);
}

function parseHTMLData() {
  return new Promise(async resolve => {
    const res = await fetch('https://gtweixin.nlc.cn/subscribe/order.html', {
      headers: {
        Host: 'gtweixin.nlc.cn',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Cookie: 'PHPSESSID=sero62mfor1okh149pglmbi6r3',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f31) NetType/WIFI Language/en',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://gtweixin.nlc.cn/subscribe'
      }
    });
    const data = await res.text();
    const $ = cheerio.load(data);
    const list = $('.swiper-wrapper')
      .children('.swiper-slide')
      .children('a')
      .map((_, el) => $(el).data());

    resolve(list);
  });
}

function verifyOrder({ day, id, indx }) {
  return new Promise<void>(async resolve => {
    const res = await fetch(
      `https://gtweixin.nlc.cn/subscribe/order/subscribe.html?day=${day}&timetableId=${id}&indx=${indx}`,
      {
        method: 'POST',
        headers: {
          Host: 'gtweixin.nlc.cn',
          Origin: 'https://gtweixin.nlc.cn',
          Cookie: 'PHPSESSID=sero62mfor1okh149pglmbi6r3',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f31) NetType/4G Language/en',
          Referer: 'https://gtweixin.nlc.cn/subscribe/order.html',
          'Accept-Language': 'en-US,en;q=0.9',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );
    const { data } = await res.json();
    const { list, order_form } = data;
    const { state, week, total, count, day: date } = order_form;

    if (state !== State.Ready || !list.flat().includes('总馆馆区')) {
      console.log('This date is not available.');
      return;
    }

    console.log(
      `${date}（${week}）一共 ${total} 个名额，还剩 ${total - count} 个名额。`
    );
    resolve();
  });
}

async function submit({ day, id }) {
  const res = await fetch(
    `https://gtweixin.nlc.cn/subscribe/order/tips.html?day=${day}&venue=6552&timetableId=${id}&timeslot=13680&order_type=10`,
    {
      headers: {
        Host: 'gtweixin.nlc.cn',
        Cookie: 'PHPSESSID=sero62mfor1okh149pglmbi6r3',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f31) NetType/WIFI Language/en',
        Referer: 'https://gtweixin.nlc.cn/subscribe/order.html',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }
  );
  const data = await res.json();
  // console.log(data);
  const { status, error } = data;
  if (!status) {
    console.log(error);
    return;
  }
  console.log('success');
}
