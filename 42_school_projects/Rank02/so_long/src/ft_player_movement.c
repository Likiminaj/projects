/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_player_movement.c                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/27 XX:XX:XX by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 17:13:40 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../header/so_long.h"

// prototype(s)
static void	ft_handle_collectible(t_mlx *mlx, int x, int y);
static void	ft_open_exit(t_mlx *mlx);
static void	ft_handle_exit_tile(t_mlx *mlx, int x, int y);
static void	ft_check_win(t_mlx *mlx, int x, int y);

void	ft_move_player(t_mlx *mlx, int dx, int dy)
{
	int	new_x;
	int	new_y;

	new_x = mlx->game_map->player->x_position + dx;
	new_y = mlx->game_map->player->y_position + dy;
	if (mlx->game_map->map[new_y][new_x] == '1')
		return ;
	if (!(mlx->game_map->exit->exit_x_position
			== mlx->game_map->player->x_position
			&& mlx->game_map->exit->exit_y_position
			== mlx->game_map->player->y_position))
		mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
			mlx->floor_image,
			mlx->game_map->player->x_position * 64,
			mlx->game_map->player->y_position * 64);
	ft_handle_collectible(mlx, new_x, new_y);
	mlx->game_map->player->x_position = new_x;
	mlx->game_map->player->y_position = new_y;
	mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
		mlx->player_image, new_x * 64, new_y * 64);
	ft_handle_exit_tile(mlx, new_x, new_y);
	mlx->total_steps++;
	ft_printf("Steps: %d\n", mlx->total_steps);
	ft_check_win(mlx, new_x, new_y);
}

static void	ft_handle_collectible(t_mlx *mlx, int x, int y)
{
	if (mlx->game_map->map[y][x] == 'C')
	{
		mlx->game_map->collectibles--;
		mlx->game_map->map[y][x] = '0';
		if (mlx->game_map->collectibles == 0)
			ft_open_exit(mlx);
	}
}

static void	ft_open_exit(t_mlx *mlx)
{
	mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
		mlx->exit_open_image,
		mlx->game_map->exit->exit_x_position * 64,
		mlx->game_map->exit->exit_y_position * 64);
}

static void	ft_handle_exit_tile(t_mlx *mlx, int x, int y)
{
	void	*exit_img;

	if (mlx->game_map->map[y][x] == 'E')
	{
		if (mlx->game_map->collectibles == 0)
			exit_img = mlx->exit_open_image;
		else
			exit_img = mlx->exit_closed_image;
		mlx_put_image_to_window(mlx->mlx_ptr, mlx->mlx_window,
			exit_img, x * 64, y * 64);
	}
}

static void	ft_check_win(t_mlx *mlx, int x, int y)
{
	if (mlx->game_map->map[y][x] == 'E' && mlx->game_map->collectibles == 0)
	{
		ft_printf("You won in %d steps!\n", mlx->total_steps);
		ft_close_window(mlx);
	}
}
