/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_game_hooks.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/27 XX:XX:XX by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 13:41:16 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../header/so_long.h"

void	ft_setup_hooks(t_mlx *mlx)
{
	mlx_hook(mlx->mlx_window, 2, 1L << 0, ft_handle_keypress, mlx);
	mlx_hook(mlx->mlx_window, 17, 0, ft_close_window, mlx);
}

int	ft_handle_keypress(int keycode, t_mlx *mlx)
{
	if (keycode == 65307)
		ft_close_window(mlx);
	else if (keycode == 119 || keycode == 65362)
		ft_move_player(mlx, 0, -1);
	else if (keycode == 115 || keycode == 65364)
		ft_move_player(mlx, 0, 1);
	else if (keycode == 97 || keycode == 65361)
		ft_move_player(mlx, -1, 0);
	else if (keycode == 100 || keycode == 65363)
		ft_move_player(mlx, 1, 0);
	return (0);
}

int	ft_close_window(t_mlx *mlx)
{
	if (mlx->player_image)
		mlx_destroy_image(mlx->mlx_ptr, mlx->player_image);
	if (mlx->collectible_image)
		mlx_destroy_image(mlx->mlx_ptr, mlx->collectible_image);
	if (mlx->exit_closed_image)
		mlx_destroy_image(mlx->mlx_ptr, mlx->exit_closed_image);
	if (mlx->exit_open_image)
		mlx_destroy_image(mlx->mlx_ptr, mlx->exit_open_image);
	if (mlx->wall_image)
		mlx_destroy_image(mlx->mlx_ptr, mlx->wall_image);
	if (mlx->floor_image)
		mlx_destroy_image(mlx->mlx_ptr, mlx->floor_image);
	if (mlx->mlx_window)
	{
		mlx_clear_window(mlx->mlx_ptr, mlx->mlx_window);
		mlx_destroy_window(mlx->mlx_ptr, mlx->mlx_window);
	}
	if (mlx->mlx_ptr)
	{
		mlx_destroy_display(mlx->mlx_ptr);
		free(mlx->mlx_ptr);
	}
	ft_clean_map_and_fd(mlx);
	exit(0);
}
