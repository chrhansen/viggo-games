import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import gameContent from '../data/games.json';
import { gameDetails } from '../../mobile/src/data/games';
import { createGameExitRequest } from '../../mobile/src/navigation/game-exit';

function exitFlow() {
  const resume = vi.fn();
  const pause = vi.fn(() => resume);
  const leave = vi.fn();
  let cancel: () => void;
  let exit: () => void;
  const confirm = vi.fn((onCancel: () => void, onExit: () => void) => {
    cancel = onCancel; exit = onExit;
  });
  const requestExit = createGameExitRequest();
  const request = () => requestExit({ pause, confirm, leave });
  return { request, pause, resume, leave, confirm, cancel: () => cancel(), exit: () => exit() };
}

describe('mobile game exits', () => {
  it('pauses and asks before exiting; cancel resumes without navigating', () => {
    const flow = exitFlow();
    flow.request();
    expect(flow.pause).toHaveBeenCalledOnce();
    expect(flow.confirm).toHaveBeenCalledOnce();
    expect(flow.leave).not.toHaveBeenCalled();
    expect(flow.resume).not.toHaveBeenCalled();
    flow.cancel();
    expect(flow.resume).toHaveBeenCalledOnce();
    expect(flow.leave).not.toHaveBeenCalled();
  });

  it('only ends the game after confirmation and never resumes it', () => {
    const flow = exitFlow();
    flow.request(); flow.exit(); flow.exit(); flow.cancel();
    expect(flow.leave).toHaveBeenCalledOnce();
    expect(flow.resume).not.toHaveBeenCalled();
  });

  it('ignores repeated back presses while confirming and allows a new request after cancellation', () => {
    const flow = exitFlow();
    flow.request(); flow.request(); flow.request();
    expect(flow.confirm).toHaveBeenCalledOnce();
    expect(flow.pause).toHaveBeenCalledOnce();
    flow.cancel(); flow.cancel();
    expect(flow.resume).toHaveBeenCalledOnce();
    flow.request();
    expect(flow.confirm).toHaveBeenCalledTimes(2);
  });

  it('disables edge and full-screen navigation gestures across the mobile stack', () => {
    const layout = fs.readFileSync('mobile/src/app/_layout.tsx', 'utf8');
    expect(layout).toContain('gestureEnabled: false');
    expect(layout).toContain('fullScreenGestureEnabled: false');
  });
});

describe('mobile game details', () => {
  it('reuses website instructions for every mission', () => {
    expect(gameDetails.map(game => game.id)).toEqual(gameContent.map(game => game.id));
    for (const game of gameDetails) {
      expect(game.howToPlay).toEqual(gameContent.find(entry => entry.id === game.id)!.howToPlay);
      expect(game.description).not.toContain('browser');
      expect(game.tips.join(' ')).not.toContain('Down or S');
    }
  });

  it('offers touch instructions and playable routes only for supported native games', () => {
    const playable = gameDetails.filter(game => game.route);
    expect(playable.map(game => game.id)).toEqual(['chicken-hop', 'hunter-guy', 'burb']);
    expect(playable.every(game => game.touchControls.length > 0)).toBe(true);
    expect(gameDetails.filter(game => game.status === 'locked').every(game => !game.route)).toBe(true);
  });

  it('routes every arcade card to details before the play action opens a game', () => {
    const selector = fs.readFileSync('mobile/src/app/index.tsx', 'utf8');
    expect(selector).toContain("pathname: '/game/[id]'");
    expect(selector).not.toContain('router.push(mission.route');
    const details = fs.readFileSync('mobile/src/app/game/[id].tsx', 'utf8');
    expect(details).toContain('PLAY NOW');
    expect(details).toContain('router.push(game.route!');
  });
});
