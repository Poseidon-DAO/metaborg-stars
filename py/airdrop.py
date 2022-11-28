import random
import logging
import os
import json
import traceback

VERBOSE:          bool = bool(
    int(os.environ.get("VERBOSE", "0")))

logger = logging.getLogger(__name__)

pages_total = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141]
stars_total = [1,4,3,1,1,1,1,2,1,2,3,2,3,2,1,1,2,1,1,2,1,1,2,3,2,1,1,1,2,3,1,2,1,2,3,2,2,1,1,2,1,1,1,1,1,1,1,2,2,4,3,2,1,2,2,5,1,4,2,4,1,1,2,1,2,1,1,1,1,1,1,1,4,1,1,2,1,1,1,4,1,1,2,4,5,3,2,2,3,2,2,1,2,1,3,1,1,2,2,2,2,2,5,4,3,1,2,3,2,2,3,5,4,4,3,4,1,2,2,4,3,1,4,5,2,5,3,3,3,3,3,3,3,3,1,5]

remaining_pages = pages_total
remaining_stars = stars_total

def duplicates(arr) -> bool: 
  len(arr) != len(set(arr))

def get_star_based_indexes(base: int):
  indexes = []
  for i, stars in enumerate(remaining_stars):
    if stars == base:
      indexes.append(i)
  return indexes

def pop_page(i):
  page = remaining_pages[i]
  stars = remaining_stars[i]
  del remaining_pages[i]
  del remaining_stars[i]
  return (page, stars)

def generate_1_1_distribution():
  f = open('airdrop_1_1.json')
  airdrop_1of1 = json.load(f)
  f.close()

  airdrop = {}
  for _, address in airdrop_1of1.items():
    received_pages = []
    result = random.choices(range(len(remaining_pages)), k=2)
    received_pages = received_pages + [pop_page(result[0]), pop_page(result[1])]

    star_indexes = get_star_based_indexes(3) + get_star_based_indexes(4)
    received_pages.append(pop_page(random.choice(star_indexes)))

    assert(not duplicates(received_pages))
    airdrop[address] = received_pages
  return airdrop

def generate_never_next_distribution():
  f = open('airdrop_never_next.json')
  airdrop_fighters = json.load(f)
  f.close()

  airdrop = {}
  for address in airdrop_fighters["ownerAddresses"]:
    airdrop[address] = [pop_page(random.choice(range(len(remaining_pages))))]
  return airdrop

def generate_always_distribution():
  f = open('airdrop_always.json')
  airdrop_fighters = json.load(f)
  f.close()

  airdrop = {}
  for address in airdrop_fighters["ownerAddresses"]:
    airdrop[address] = [pop_page(random.choice(range(len(remaining_pages))))]
  return airdrop

def generate_artist_distribution():
  received_pages = []
  for _ in range(10):
    received_pages.append(pop_page(random.choice(range(len(remaining_pages)))))
  assert(not duplicates(received_pages))
  return {"0xe1e57c6d779adea0f34cd3b84fb6bae3a54d1cfd": received_pages}

def merge_airdrop(airdrop, distr):
  for addr, page in distr.items():
    if addr not in airdrop:
      airdrop[addr] = page
    else:
      airdrop[addr] = airdrop[addr] + page
      
def count_airdrop(airdrop):
  distributed = 0
  for _, pages in airdrop.items():
    for _ in pages:
      distributed += 1
  return distributed

def print_distribution(airdrop):
  airdrop_addresses = "["
  airdrop_pages = []
  for address, pages in airdrop.items():
    for page in pages:
      airdrop_addresses = airdrop_addresses + '"{}", '.format(address)
      airdrop_pages.append(page[0])

  print('Distributed pages: {}'.format(count_airdrop(airdrop)))
  print('Remaining pages: {}'.format(len(remaining_pages)))

  print('\nAddresses airdrop: {}]'.format(airdrop_addresses[:len(airdrop_addresses)-2]))
  print('Pages airdrop: {}'.format(airdrop_pages[:len(airdrop_pages)-2]))

  print('\nPages initialize: {}'.format(remaining_pages))
  print('Stars initialize: {}'.format(remaining_stars))
      

if __name__ == '__main__':
    try:
      if VERBOSE == 0:
          # basic log setting: write on file named sensors_main (in folder named logs)
          logging.basicConfig(level=logging.INFO, format="%(asctime)-15s %(levelname)-10s %(message)s")
      else:
          logging.basicConfig(level=logging.INFO, format="%(asctime)-10s %(levelname)-10s %(message)s")

      airdrop = {}
      
      distr = generate_1_1_distribution()
      merge_airdrop(airdrop, distr)

      distr = generate_never_next_distribution()
      merge_airdrop(airdrop, distr)

      distr = generate_always_distribution()
      merge_airdrop(airdrop, distr)

      distr = generate_artist_distribution()
      merge_airdrop(airdrop, distr)

      print_distribution(airdrop)      
    except Exception as ex:
      tb_lines = [ line.rstrip('\n') for line in
                 traceback.format_exception(ex.__class__, ex, None)]
      logging.critical(tb_lines)

